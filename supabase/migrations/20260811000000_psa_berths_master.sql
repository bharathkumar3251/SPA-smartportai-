-- =========================================================
-- PSA MASTER BERTHS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.berths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  terminal_name TEXT NOT NULL,
  max_draft_m NUMERIC NOT NULL DEFAULT 16.0,
  length_m NUMERIC NOT NULL DEFAULT 350.0,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.berths TO authenticated;
GRANT ALL ON public.berths TO service_role;
ALTER TABLE public.berths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read berths" ON public.berths
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authority manage berths" ON public.berths
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin', 'port_authority']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin', 'port_authority']::public.app_role[]));

-- Seed PSA Singapore Master Berths
INSERT INTO public.berths (code, terminal_name, max_draft_m, length_m, status) VALUES
  ('PPT-B01', 'Pasir Panjang Terminal', 18.0, 400.0, 'available'),
  ('PPT-B02', 'Pasir Panjang Terminal', 18.0, 400.0, 'available'),
  ('PPT-B03', 'Pasir Panjang Terminal', 18.0, 400.0, 'occupied'),
  ('PPT-B04', 'Pasir Panjang Terminal', 18.0, 400.0, 'available'),
  ('PPT-B05', 'Pasir Panjang Terminal', 18.0, 400.0, 'available'),
  ('PPT-B06', 'Pasir Panjang Terminal', 16.0, 350.0, 'available'),
  ('PPT-B07', 'Pasir Panjang Terminal', 16.0, 350.0, 'available'),
  ('PPT-B08', 'Pasir Panjang Terminal', 16.0, 350.0, 'maintenance'),
  ('PPT-B09', 'Pasir Panjang Terminal', 16.0, 350.0, 'available'),
  ('PPT-B10', 'Pasir Panjang Terminal', 16.0, 350.0, 'available'),
  ('TJB-B01', 'Tanjong Pagar Terminal', 15.0, 320.0, 'available'),
  ('TJB-B02', 'Tanjong Pagar Terminal', 15.0, 320.0, 'available'),
  ('TJB-B03', 'Tanjong Pagar Terminal', 15.0, 320.0, 'occupied'),
  ('TJB-B04', 'Tanjong Pagar Terminal', 15.0, 320.0, 'available'),
  ('KPT-B01', 'Keppel Terminal', 14.5, 300.0, 'available'),
  ('KPT-B02', 'Keppel Terminal', 14.5, 300.0, 'available'),
  ('KPT-B03', 'Keppel Terminal', 14.5, 300.0, 'available'),
  ('JRB-B01', 'Jurong Port', 14.0, 280.0, 'available'),
  ('JRB-B02', 'Jurong Port', 14.0, 280.0, 'available'),
  ('JRB-B03', 'Jurong Port', 14.0, 280.0, 'available')
ON CONFLICT (code) DO NOTHING;
