-- ============ PRODUCTION REPORT ============
CREATE TABLE public.production_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  bcnt_used INTEGER NOT NULL DEFAULT 0,
  bcnt_produced INTEGER NOT NULL DEFAULT 0,
  top_used INTEGER NOT NULL DEFAULT 0,
  top_produced INTEGER NOT NULL DEFAULT 0,
  sup_used INTEGER NOT NULL DEFAULT 0,
  sup_produced INTEGER NOT NULL DEFAULT 0,
  exe_used INTEGER NOT NULL DEFAULT 0,
  exe_produced INTEGER NOT NULL DEFAULT 0,
  brw_used INTEGER NOT NULL DEFAULT 0,
  brw_produced INTEGER NOT NULL DEFAULT 0,
  scnt_used INTEGER NOT NULL DEFAULT 0,
  scnt_produced INTEGER NOT NULL DEFAULT 0,
  nat_used INTEGER NOT NULL DEFAULT 0,
  nat_produced INTEGER NOT NULL DEFAULT 0,
  mac_used INTEGER NOT NULL DEFAULT 0,
  mac_produced INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  total_produced INTEGER NOT NULL DEFAULT 0,
  bakers INTEGER NOT NULL DEFAULT 0,
  packers INTEGER NOT NULL DEFAULT 0,
  management INTEGER NOT NULL DEFAULT 0,
  total_staff INTEGER NOT NULL DEFAULT 0,
  bcnt_damaged INTEGER NOT NULL DEFAULT 0,
  top_damaged INTEGER NOT NULL DEFAULT 0,
  sup_damaged INTEGER NOT NULL DEFAULT 0,
  exe_damaged INTEGER NOT NULL DEFAULT 0,
  brw_damaged INTEGER NOT NULL DEFAULT 0,
  scnt_damaged INTEGER NOT NULL DEFAULT 0,
  nat_damaged INTEGER NOT NULL DEFAULT 0,
  mac_damaged INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_reports TO authenticated;
GRANT ALL ON public.production_reports TO service_role;
ALTER TABLE public.production_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prod_reports_read" ON public.production_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "prod_reports_insert" ON public.production_reports FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'production_staff') OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "prod_reports_update_owner" ON public.production_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "prod_reports_delete_owner" ON public.production_reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE INDEX prod_reports_date ON public.production_reports(report_date DESC);
CREATE TRIGGER prod_reports_updated BEFORE UPDATE ON public.production_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
