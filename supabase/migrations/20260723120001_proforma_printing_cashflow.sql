
-- ============ PROFORMA ORDERS ============
CREATE TABLE public.proforma_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  product_type_id UUID REFERENCES public.product_types(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','fulfilled','cancelled')),
  notes TEXT,
  logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proforma_orders TO authenticated;
GRANT ALL ON public.proforma_orders TO service_role;
ALTER TABLE public.proforma_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proforma_read" ON public.proforma_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "proforma_insert" ON public.proforma_orders FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'sales_clerk'));
CREATE POLICY "proforma_update_owner" ON public.proforma_orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "proforma_delete_owner" ON public.proforma_orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE INDEX proforma_orders_date ON public.proforma_orders(order_date DESC);
CREATE TRIGGER proforma_orders_updated BEFORE UPDATE ON public.proforma_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PRINTING JOBS ============
CREATE TABLE public.printing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'label',
  quantity INTEGER NOT NULL DEFAULT 0,
  cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  vendor TEXT,
  notes TEXT,
  logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.printing_jobs TO authenticated;
GRANT ALL ON public.printing_jobs TO service_role;
ALTER TABLE public.printing_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "printing_read" ON public.printing_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "printing_insert" ON public.printing_jobs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'production_staff'));
CREATE POLICY "printing_update_owner" ON public.printing_jobs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "printing_delete_owner" ON public.printing_jobs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE INDEX printing_jobs_date ON public.printing_jobs(job_date DESC);
CREATE TRIGGER printing_jobs_updated BEFORE UPDATE ON public.printing_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CASH FLOW ENTRIES ============
CREATE TABLE public.cash_flow_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('inflow','outflow','transfer')),
  category TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  source_or_destination TEXT,
  description TEXT,
  reference TEXT,
  notes TEXT,
  logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_flow_entries TO authenticated;
GRANT ALL ON public.cash_flow_entries TO service_role;
ALTER TABLE public.cash_flow_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cashflow_read" ON public.cash_flow_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "cashflow_insert" ON public.cash_flow_entries FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'sales_clerk'));
CREATE POLICY "cashflow_update_owner" ON public.cash_flow_entries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "cashflow_delete_owner" ON public.cash_flow_entries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE INDEX cashflow_entries_date ON public.cash_flow_entries(entry_date DESC);
CREATE TRIGGER cashflow_entries_updated BEFORE UPDATE ON public.cash_flow_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ FINISHED GOODS STOCK ============
CREATE TABLE public.finished_goods_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id UUID NOT NULL REFERENCES public.product_types(id) ON DELETE CASCADE,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_type_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finished_goods_stock TO authenticated;
GRANT ALL ON public.finished_goods_stock TO service_role;
ALTER TABLE public.finished_goods_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fgs_read" ON public.finished_goods_stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "fgs_owner_write" ON public.finished_goods_stock FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "fgs_prod_update" ON public.finished_goods_stock FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'production_staff')) WITH CHECK (public.has_role(auth.uid(), 'production_staff'));
CREATE TRIGGER fgs_updated BEFORE UPDATE ON public.finished_goods_stock
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- seed finished goods stock with zero balances
INSERT INTO public.finished_goods_stock (product_type_id, quantity_in_stock, low_stock_threshold, unit_price)
SELECT id, 0, 50, 0 FROM public.product_types;
