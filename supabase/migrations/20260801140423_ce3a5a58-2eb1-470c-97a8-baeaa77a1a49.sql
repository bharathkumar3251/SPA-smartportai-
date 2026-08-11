-- ============ 1. REGISTRATION: keep requested role, always pending ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  req_role public.app_role;
BEGIN
  BEGIN
    req_role := (meta->>'requested_role')::public.app_role;
  EXCEPTION WHEN OTHERS THEN
    req_role := NULL;
  END;

  INSERT INTO public.profiles (id, email, first_name, last_name, organization, requested_role, status)
  VALUES (
    NEW.id, NEW.email,
    meta->>'first_name', meta->>'last_name', meta->>'organization',
    req_role,
    'pending'::public.account_status
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- approval grants the requested role
CREATE OR REPLACE FUNCTION public.approve_role_request(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.user_roles (user_id, role, granted_by) VALUES (_user_id, _role, auth.uid())
  ON CONFLICT DO NOTHING;
  UPDATE public.profiles SET status = 'active', requested_role = NULL WHERE id = _user_id;
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), 'role_change', 'user', _user_id::text, jsonb_build_object('granted_role', _role));
END; $function$;

-- ============ 2. WORKFLOW ENUMS ============
CREATE TYPE public.submission_stage AS ENUM (
  'uploaded','ai_verification','ai_needs_review','ai_rejected',
  'authority_review','modification_requested','authority_rejected','authority_approved',
  'customs_review','customs_hold','customs_rejected','customs_cleared',
  'final_approval','final_approved','berth_assigned',
  'terminal_scheduled','unloading','warehouse_received','dispatch_ready','in_transit','delivered'
);

CREATE TYPE public.ai_verdict AS ENUM ('verified','needs_manual_review','rejected');

CREATE TYPE public.document_type AS ENUM (
  'vessel_arrival_notice','cargo_manifest','bill_of_lading','crew_list',
  'dangerous_goods_declaration','container_list','insurance_certificate',
  'port_clearance','eta_information'
);

CREATE TYPE public.document_status AS ENUM ('uploaded','verified','flagged','rejected');

CREATE TYPE public.container_stage AS ENUM (
  'at_vessel','unloading','yard','warehouse_received','stored','dispatch_ready','assigned_truck','in_transit','delivered'
);

-- helper: any operational (non-shipping) portal role
CREATE OR REPLACE FUNCTION public.has_ops_visibility(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','port_authority','customs_officer','terminal_operator',
                   'warehouse_manager','truck_operator','logistics_manager','data_analyst')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_advance_workflow(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','port_authority','customs_officer','terminal_operator',
                   'warehouse_manager','truck_operator')
  );
$$;

-- ============ 3. SUBMISSIONS ============
CREATE TABLE public.shipment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference text NOT NULL,
  shipping_company text NOT NULL,
  vessel_name text NOT NULL,
  imo_number text,
  voyage_number text,
  cargo_type text,
  container_count integer NOT NULL DEFAULT 0,
  dangerous_goods boolean NOT NULL DEFAULT false,
  origin_port text,
  eta timestamptz,
  etd timestamptz,
  stage public.submission_stage NOT NULL DEFAULT 'uploaded',
  ai_risk_score numeric,
  ai_confidence numeric,
  ai_verdict public.ai_verdict,
  authority_notes text,
  customs_notes text,
  inspection_notes text,
  berth_code text,
  arrival_window_start timestamptz,
  arrival_window_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipment_submissions TO authenticated;
GRANT ALL ON public.shipment_submissions TO service_role;
ALTER TABLE public.shipment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners read own submissions" ON public.shipment_submissions
  FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.has_ops_visibility(auth.uid()));
CREATE POLICY "shipping creates submissions" ON public.shipment_submissions
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "owners update own draft submissions" ON public.shipment_submissions
  FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "stage owners advance submissions" ON public.shipment_submissions
  FOR UPDATE TO authenticated USING (public.can_advance_workflow(auth.uid())) WITH CHECK (public.can_advance_workflow(auth.uid()));
CREATE POLICY "admins delete submissions" ON public.shipment_submissions
  FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()) OR created_by = auth.uid());
CREATE TRIGGER shipment_submissions_updated_at BEFORE UPDATE ON public.shipment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_submissions_stage ON public.shipment_submissions(stage);
CREATE INDEX idx_submissions_created_by ON public.shipment_submissions(created_by);

-- ============ 4. DOCUMENTS ============
CREATE TABLE public.submission_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.shipment_submissions(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type public.document_type NOT NULL,
  file_name text NOT NULL,
  file_path text,
  mime_type text,
  file_size integer,
  issued_on date,
  expires_on date,
  status public.document_status NOT NULL DEFAULT 'uploaded',
  ai_findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submission_documents TO authenticated;
GRANT ALL ON public.submission_documents TO service_role;
ALTER TABLE public.submission_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read documents" ON public.submission_documents
  FOR SELECT TO authenticated USING (
    uploaded_by = auth.uid() OR public.has_ops_visibility(auth.uid())
    OR EXISTS (SELECT 1 FROM public.shipment_submissions s WHERE s.id = submission_id AND s.created_by = auth.uid())
  );
CREATE POLICY "upload own documents" ON public.submission_documents
  FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "update documents" ON public.submission_documents
  FOR UPDATE TO authenticated USING (uploaded_by = auth.uid() OR public.can_advance_workflow(auth.uid()))
  WITH CHECK (uploaded_by = auth.uid() OR public.can_advance_workflow(auth.uid()));
CREATE POLICY "delete own documents" ON public.submission_documents
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE TRIGGER submission_documents_updated_at BEFORE UPDATE ON public.submission_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_documents_submission ON public.submission_documents(submission_id);

-- ============ 5. AI VERIFICATIONS ============
CREATE TABLE public.ai_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.shipment_submissions(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'documents',
  risk_score numeric NOT NULL DEFAULT 0,
  confidence numeric NOT NULL DEFAULT 0,
  verdict public.ai_verdict NOT NULL DEFAULT 'needs_manual_review',
  issues jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  checks jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ai_verifications TO authenticated;
GRANT ALL ON public.ai_verifications TO service_role;
ALTER TABLE public.ai_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read verifications" ON public.ai_verifications
  FOR SELECT TO authenticated USING (
    public.has_ops_visibility(auth.uid())
    OR EXISTS (SELECT 1 FROM public.shipment_submissions s WHERE s.id = submission_id AND s.created_by = auth.uid())
  );
CREATE POLICY "insert verifications" ON public.ai_verifications
  FOR INSERT TO authenticated WITH CHECK (
    public.can_advance_workflow(auth.uid())
    OR EXISTS (SELECT 1 FROM public.shipment_submissions s WHERE s.id = submission_id AND s.created_by = auth.uid())
  );
CREATE INDEX idx_verifications_submission ON public.ai_verifications(submission_id);

-- ============ 6. WORKFLOW EVENTS (timeline / activity log) ============
CREATE TABLE public.workflow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.shipment_submissions(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role public.app_role,
  actor_label text,
  stage public.submission_stage NOT NULL,
  action text NOT NULL,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.workflow_events TO authenticated;
GRANT ALL ON public.workflow_events TO service_role;
ALTER TABLE public.workflow_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read workflow events" ON public.workflow_events
  FOR SELECT TO authenticated USING (
    public.has_ops_visibility(auth.uid())
    OR EXISTS (SELECT 1 FROM public.shipment_submissions s WHERE s.id = submission_id AND s.created_by = auth.uid())
  );
CREATE POLICY "insert workflow events" ON public.workflow_events
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);
CREATE INDEX idx_events_submission ON public.workflow_events(submission_id, created_at DESC);

-- ============ 7. CONTAINERS (terminal -> warehouse -> trucking -> delivery) ============
CREATE TABLE public.containers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.shipment_submissions(id) ON DELETE CASCADE,
  container_no text NOT NULL,
  iso_type text,
  weight_kg integer,
  hazardous boolean NOT NULL DEFAULT false,
  stage public.container_stage NOT NULL DEFAULT 'at_vessel',
  yard_slot text,
  crane_id text,
  unloading_team text,
  storage_slot text,
  truck_plate text,
  driver_name text,
  pickup_at timestamptz,
  delivered_at timestamptz,
  destination text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.containers TO authenticated;
GRANT ALL ON public.containers TO service_role;
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read containers" ON public.containers
  FOR SELECT TO authenticated USING (
    public.has_ops_visibility(auth.uid())
    OR EXISTS (SELECT 1 FROM public.shipment_submissions s WHERE s.id = submission_id AND s.created_by = auth.uid())
  );
CREATE POLICY "ops manage containers" ON public.containers
  FOR INSERT TO authenticated WITH CHECK (public.can_advance_workflow(auth.uid()));
CREATE POLICY "ops update containers" ON public.containers
  FOR UPDATE TO authenticated USING (public.can_advance_workflow(auth.uid())) WITH CHECK (public.can_advance_workflow(auth.uid()));
CREATE POLICY "admins delete containers" ON public.containers
  FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE TRIGGER containers_updated_at BEFORE UPDATE ON public.containers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_containers_submission ON public.containers(submission_id);
CREATE INDEX idx_containers_stage ON public.containers(stage);

-- ============ 8. NOTIFY NEXT ROLE ON STAGE CHANGE ============
CREATE OR REPLACE FUNCTION public.notify_stage_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target_role public.app_role;
  title text;
BEGIN
  IF NEW.stage = OLD.stage THEN RETURN NEW; END IF;

  CASE NEW.stage
    WHEN 'authority_review' THEN target_role := 'port_authority'; title := 'New submission awaiting authority review';
    WHEN 'authority_approved' THEN target_role := 'customs_officer'; title := 'Submission approved by Port Authority — customs clearance required';
    WHEN 'customs_cleared' THEN target_role := 'port_authority'; title := 'Customs cleared — final approval required';
    WHEN 'berth_assigned' THEN target_role := 'terminal_operator'; title := 'Berth assigned — prepare terminal operations';
    WHEN 'warehouse_received' THEN target_role := 'warehouse_manager'; title := 'Containers arriving at warehouse';
    WHEN 'dispatch_ready' THEN target_role := 'truck_operator'; title := 'Pickup request ready for scheduling';
    WHEN 'in_transit' THEN target_role := 'logistics_manager'; title := 'Shipment in transit';
    ELSE target_role := NULL;
  END CASE;

  IF target_role IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, category, priority, title, body, link, metadata)
    SELECT ur.user_id, 'workflow', 'high', title,
           NEW.vessel_name || ' · ' || NEW.reference, '/app/notifications',
           jsonb_build_object('submission_id', NEW.id, 'stage', NEW.stage)
    FROM public.user_roles ur WHERE ur.role = target_role;
  END IF;

  -- always notify the shipping line owner
  INSERT INTO public.notifications (user_id, category, priority, title, body, link, metadata)
  VALUES (NEW.created_by, 'workflow', 'normal',
          'Submission status: ' || replace(NEW.stage::text, '_', ' '),
          NEW.vessel_name || ' · ' || NEW.reference, '/app/shipping',
          jsonb_build_object('submission_id', NEW.id, 'stage', NEW.stage));

  RETURN NEW;
END; $$;

CREATE TRIGGER submissions_notify_stage_change
AFTER UPDATE OF stage ON public.shipment_submissions
FOR EACH ROW EXECUTE FUNCTION public.notify_stage_change();