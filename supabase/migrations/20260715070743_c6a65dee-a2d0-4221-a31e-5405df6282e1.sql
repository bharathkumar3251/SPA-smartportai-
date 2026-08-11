
-- =========================================================
-- 1. ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM (
  'super_admin',
  'port_authority',
  'terminal_operator',
  'shipping_company',
  'customs_officer',
  'warehouse_manager',
  'truck_operator',
  'logistics_manager',
  'ai_administrator',
  'data_analyst'
);

CREATE TYPE public.account_status AS ENUM ('pending', 'active', 'disabled');

CREATE TYPE public.audit_action AS ENUM (
  'login',
  'logout',
  'failed_login',
  'password_change',
  'role_change',
  'user_created',
  'user_updated',
  'user_disabled',
  'user_activated',
  'data_created',
  'data_updated',
  'data_deleted',
  'ai_model_execution',
  'report_generated',
  'api_access',
  'permission_denied'
);

CREATE TYPE public.notification_priority AS ENUM ('low', 'normal', 'high', 'critical');

-- =========================================================
-- 2. PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  organization TEXT,
  avatar_url TEXT,
  status public.account_status NOT NULL DEFAULT 'pending',
  requested_role public.app_role,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 3. USER ROLES
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security-definer helper (must exist before RLS uses it)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.primary_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'super_admin' THEN 0
    WHEN 'port_authority' THEN 1
    WHEN 'ai_administrator' THEN 2
    WHEN 'logistics_manager' THEN 3
    WHEN 'terminal_operator' THEN 4
    WHEN 'shipping_company' THEN 5
    WHEN 'customs_officer' THEN 6
    WHEN 'warehouse_manager' THEN 7
    WHEN 'truck_operator' THEN 8
    WHEN 'ai_administrator' THEN 9
    WHEN 'data_analyst' THEN 10
    ELSE 99
  END
  LIMIT 1;
$$;

-- Profiles policies
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_super_admin(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Admins insert profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()) OR auth.uid() = id);

-- User roles policies
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- =========================================================
-- 4. AUDIT LOGS
-- =========================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action public.audit_action NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own audit" ON public.audit_logs
  FOR SELECT TO authenticated USING (actor_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "Users insert own audit" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

-- =========================================================
-- 5. LOGIN HISTORY
-- =========================================================
CREATE TABLE public.login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  device_label TEXT,
  location TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_login_history_user ON public.login_history(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.login_history TO authenticated;
GRANT ALL ON public.login_history TO service_role;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own login history" ON public.login_history
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "Users insert own login history" ON public.login_history
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- =========================================================
-- 6. NOTIFICATIONS
-- =========================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'system',
  priority public.notification_priority NOT NULL DEFAULT 'normal',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- =========================================================
-- 7. TRIGGERS
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-provision profile + assign requested/default role (data_analyst) on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    NEW.id,
    NEW.email,
    meta->>'first_name',
    meta->>'last_name',
    meta->>'organization',
    req_role,
    CASE WHEN req_role IS NULL OR req_role = 'data_analyst' THEN 'active'::public.account_status ELSE 'pending'::public.account_status END
  );

  -- Every user gets data_analyst by default; requested role is granted after admin approval
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'data_analyst')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- 8. ADMIN APPROVAL RPC
-- =========================================================
CREATE OR REPLACE FUNCTION public.approve_role_request(_user_id UUID, _role public.app_role)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.user_roles (user_id, role, granted_by) VALUES (_user_id, _role, auth.uid())
  ON CONFLICT DO NOTHING;
  UPDATE public.profiles SET status = 'active', requested_role = NULL WHERE id = _user_id;
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), 'role_change', 'user', _user_id::text, jsonb_build_object('granted_role', _role));
END; $$;

CREATE OR REPLACE FUNCTION public.revoke_role(_user_id UUID, _role public.app_role)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role;
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), 'role_change', 'user', _user_id::text, jsonb_build_object('revoked_role', _role));
END; $$;

CREATE OR REPLACE FUNCTION public.set_account_status(_user_id UUID, _status public.account_status)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.profiles SET status = _status WHERE id = _user_id;
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), CASE WHEN _status='disabled' THEN 'user_disabled' ELSE 'user_activated' END::public.audit_action,
          'user', _user_id::text, jsonb_build_object('status', _status));
END; $$;
