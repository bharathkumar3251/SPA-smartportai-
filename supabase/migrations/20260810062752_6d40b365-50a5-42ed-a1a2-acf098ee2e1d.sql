-- helper: does the user hold any of the given roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles));
$$;

-- allowed submission stage transitions
CREATE OR REPLACE FUNCTION public.allowed_submission_next(_from submission_stage)
RETURNS submission_stage[] LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _from
    WHEN 'uploaded'               THEN ARRAY['uploaded','ai_verification','authority_review']
    WHEN 'ai_verification'        THEN ARRAY['ai_verification','ai_needs_review','ai_rejected','authority_review']
    WHEN 'ai_needs_review'        THEN ARRAY['authority_review','ai_rejected','ai_verification']
    WHEN 'ai_rejected'            THEN ARRAY['uploaded','ai_verification']
    WHEN 'authority_review'       THEN ARRAY['authority_approved','authority_rejected','modification_requested','customs_review']
    WHEN 'modification_requested' THEN ARRAY['uploaded','ai_verification','authority_review']
    WHEN 'authority_rejected'     THEN ARRAY['uploaded','ai_verification']
    WHEN 'authority_approved'     THEN ARRAY['customs_review','customs_hold','customs_cleared','customs_rejected']
    WHEN 'customs_review'         THEN ARRAY['customs_hold','customs_cleared','customs_rejected']
    WHEN 'customs_hold'           THEN ARRAY['customs_cleared','customs_rejected','customs_review']
    WHEN 'customs_rejected'       THEN ARRAY['uploaded','customs_review']
    WHEN 'customs_cleared'        THEN ARRAY['final_approval','final_approved']
    WHEN 'final_approval'         THEN ARRAY['final_approved','authority_rejected']
    WHEN 'final_approved'         THEN ARRAY['berth_assigned']
    WHEN 'berth_assigned'         THEN ARRAY['terminal_scheduled','berth_assigned']
    WHEN 'terminal_scheduled'     THEN ARRAY['unloading']
    WHEN 'unloading'              THEN ARRAY['warehouse_received']
    WHEN 'warehouse_received'     THEN ARRAY['dispatch_ready']
    WHEN 'dispatch_ready'         THEN ARRAY['in_transit']
    WHEN 'in_transit'             THEN ARRAY['delivered']
    ELSE ARRAY[]::text[]
  END::submission_stage[];
$$;

-- which roles may move a submission INTO a stage
CREATE OR REPLACE FUNCTION public.roles_for_submission_stage(_to submission_stage)
RETURNS app_role[] LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _to
    WHEN 'uploaded'               THEN ARRAY['shipping_company']
    WHEN 'ai_verification'        THEN ARRAY['shipping_company','port_authority']
    WHEN 'ai_needs_review'        THEN ARRAY['shipping_company','port_authority']
    WHEN 'ai_rejected'            THEN ARRAY['shipping_company','port_authority']
    WHEN 'authority_review'       THEN ARRAY['shipping_company','port_authority']
    WHEN 'modification_requested' THEN ARRAY['port_authority']
    WHEN 'authority_rejected'     THEN ARRAY['port_authority']
    WHEN 'authority_approved'     THEN ARRAY['port_authority']
    WHEN 'customs_review'         THEN ARRAY['port_authority','customs_officer']
    WHEN 'customs_hold'           THEN ARRAY['customs_officer']
    WHEN 'customs_cleared'        THEN ARRAY['customs_officer']
    WHEN 'customs_rejected'       THEN ARRAY['customs_officer']
    WHEN 'final_approval'         THEN ARRAY['port_authority']
    WHEN 'final_approved'         THEN ARRAY['port_authority']
    WHEN 'berth_assigned'         THEN ARRAY['port_authority']
    WHEN 'terminal_scheduled'     THEN ARRAY['terminal_operator']
    WHEN 'unloading'              THEN ARRAY['terminal_operator']
    WHEN 'warehouse_received'     THEN ARRAY['warehouse_manager','terminal_operator']
    WHEN 'dispatch_ready'         THEN ARRAY['warehouse_manager']
    WHEN 'in_transit'             THEN ARRAY['truck_operator']
    WHEN 'delivered'              THEN ARRAY['truck_operator','logistics_manager']
    ELSE ARRAY[]::text[]
  END::app_role[];
$$;

CREATE OR REPLACE FUNCTION public.enforce_submission_stage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  allowed submission_stage[];
  actors  app_role[];
  uid uuid := auth.uid();
BEGIN
  IF NEW.stage = OLD.stage THEN RETURN NEW; END IF;

  allowed := public.allowed_submission_next(OLD.stage);
  IF NOT (NEW.stage = ANY(allowed)) THEN
    RAISE EXCEPTION 'Invalid status transition: % -> % is not permitted by the port workflow',
      replace(OLD.stage::text,'_',' '), replace(NEW.stage::text,'_',' ');
  END IF;

  actors := public.roles_for_submission_stage(NEW.stage);
  IF uid IS NOT NULL
     AND NOT public.is_super_admin(uid)
     AND NOT public.has_any_role(uid, actors) THEN
    RAISE EXCEPTION 'Not authorised: your role cannot set the status "%"', replace(NEW.stage::text,'_',' ');
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (uid, 'data_updated', 'shipment_submission', NEW.id::text,
          jsonb_build_object('field','stage','previous_value',OLD.stage,'new_value',NEW.stage,'reference',NEW.reference));

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS submissions_enforce_stage ON public.shipment_submissions;
CREATE TRIGGER submissions_enforce_stage BEFORE UPDATE OF stage ON public.shipment_submissions
FOR EACH ROW EXECUTE FUNCTION public.enforce_submission_stage();

-- container movement engine
CREATE OR REPLACE FUNCTION public.allowed_container_next(_from container_stage)
RETURNS container_stage[] LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _from
    WHEN 'at_vessel'          THEN ARRAY['unloading']
    WHEN 'unloading'          THEN ARRAY['yard']
    WHEN 'yard'               THEN ARRAY['warehouse_received']
    WHEN 'warehouse_received' THEN ARRAY['stored']
    WHEN 'stored'             THEN ARRAY['dispatch_ready']
    WHEN 'dispatch_ready'     THEN ARRAY['assigned_truck']
    WHEN 'assigned_truck'     THEN ARRAY['in_transit']
    WHEN 'in_transit'         THEN ARRAY['delivered']
    ELSE ARRAY[]::text[]
  END::container_stage[];
$$;

CREATE OR REPLACE FUNCTION public.roles_for_container_stage(_to container_stage)
RETURNS app_role[] LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _to
    WHEN 'unloading'          THEN ARRAY['terminal_operator']
    WHEN 'yard'               THEN ARRAY['terminal_operator']
    WHEN 'warehouse_received' THEN ARRAY['warehouse_manager','terminal_operator']
    WHEN 'stored'             THEN ARRAY['warehouse_manager']
    WHEN 'dispatch_ready'     THEN ARRAY['warehouse_manager']
    WHEN 'assigned_truck'     THEN ARRAY['truck_operator']
    WHEN 'in_transit'         THEN ARRAY['truck_operator']
    WHEN 'delivered'          THEN ARRAY['truck_operator','logistics_manager']
    ELSE ARRAY[]::text[]
  END::app_role[];
$$;

CREATE OR REPLACE FUNCTION public.enforce_container_stage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  allowed container_stage[];
  actors  app_role[];
  uid uuid := auth.uid();
BEGIN
  IF NEW.stage = OLD.stage THEN RETURN NEW; END IF;

  allowed := public.allowed_container_next(OLD.stage);
  IF NOT (NEW.stage = ANY(allowed)) THEN
    RAISE EXCEPTION 'Invalid container movement: % -> % is not permitted',
      replace(OLD.stage::text,'_',' '), replace(NEW.stage::text,'_',' ');
  END IF;

  actors := public.roles_for_container_stage(NEW.stage);
  IF uid IS NOT NULL
     AND NOT public.is_super_admin(uid)
     AND NOT public.has_any_role(uid, actors) THEN
    RAISE EXCEPTION 'Not authorised: your role cannot move a container to "%"', replace(NEW.stage::text,'_',' ');
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (uid, 'data_updated', 'container', NEW.id::text,
          jsonb_build_object('field','stage','previous_value',OLD.stage,'new_value',NEW.stage,'container_no',NEW.container_no));

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS containers_enforce_stage ON public.containers;
CREATE TRIGGER containers_enforce_stage BEFORE UPDATE OF stage ON public.containers
FOR EACH ROW EXECUTE FUNCTION public.enforce_container_stage();

GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.allowed_submission_next(submission_stage) TO authenticated;
GRANT EXECUTE ON FUNCTION public.allowed_container_next(container_stage) TO authenticated;