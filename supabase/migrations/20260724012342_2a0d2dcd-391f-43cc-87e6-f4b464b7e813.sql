
-- =========================================================
-- product_types
-- =========================================================
CREATE TABLE public.product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  default_unit_price NUMERIC(14,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_types TO authenticated;
GRANT ALL ON public.product_types TO service_role;
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read product_types" ON public.product_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner write product_types" ON public.product_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE TRIGGER trg_product_types_updated_at BEFORE UPDATE ON public.product_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.product_types (name) VALUES
  ('SACHET WATER'), ('BOTTLE WATER'), ('TABLE WATER');

-- =========================================================
-- customers (factory-sale customers, distinct from agents)
-- =========================================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales/owner insert customers" ON public.customers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'sales_clerk'));
CREATE POLICY "sales/owner update customers" ON public.customers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'sales_clerk'));
CREATE POLICY "owner delete customers" ON public.customers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- factory_sales
-- =========================================================
CREATE TABLE public.factory_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  product TEXT NOT NULL,
  price_per_loaf NUMERIC(14,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  damage_qty INTEGER NOT NULL DEFAULT 0,
  damage_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  return_qty INTEGER NOT NULL DEFAULT 0,
  return_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_quantity INTEGER NOT NULL DEFAULT 0,
  net_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  fuel_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  commission_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  salary_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.factory_sales TO authenticated;
GRANT ALL ON public.factory_sales TO service_role;
ALTER TABLE public.factory_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read factory_sales" ON public.factory_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales/owner insert factory_sales" ON public.factory_sales FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'sales_clerk'));
CREATE POLICY "sales/owner update factory_sales" ON public.factory_sales FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'sales_clerk'));
CREATE POLICY "owner delete factory_sales" ON public.factory_sales FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE TRIGGER trg_factory_sales_updated_at BEFORE UPDATE ON public.factory_sales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_factory_sales_date ON public.factory_sales(sale_date);
CREATE INDEX idx_factory_sales_customer ON public.factory_sales(customer_id);

-- =========================================================
-- cash_flow_entries
-- =========================================================
CREATE TABLE public.cash_flow_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('inflow','outflow')),
  category TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  source_or_destination TEXT,
  description TEXT,
  notes TEXT,
  logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_flow_entries TO authenticated;
GRANT ALL ON public.cash_flow_entries TO service_role;
ALTER TABLE public.cash_flow_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read cash_flow" ON public.cash_flow_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales/owner insert cash_flow" ON public.cash_flow_entries FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'sales_clerk'));
CREATE POLICY "sales/owner update cash_flow" ON public.cash_flow_entries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'sales_clerk'));
CREATE POLICY "owner delete cash_flow" ON public.cash_flow_entries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE TRIGGER trg_cash_flow_updated_at BEFORE UPDATE ON public.cash_flow_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_cash_flow_date ON public.cash_flow_entries(entry_date);

-- =========================================================
-- ingredient_usage_logs
-- =========================================================
CREATE TABLE public.ingredient_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  product_type_id UUID NOT NULL REFERENCES public.product_types(id) ON DELETE CASCADE,
  flour_bags NUMERIC(10,2) NOT NULL DEFAULT 0,
  flour_measure_g NUMERIC(12,2) NOT NULL DEFAULT 0,
  flour_used_g NUMERIC(12,2) NOT NULL DEFAULT 0,
  sugar_measure_g NUMERIC(12,2) NOT NULL DEFAULT 0,
  sugar_used_g NUMERIC(12,2) NOT NULL DEFAULT 0,
  salt_measure_g NUMERIC(12,2) NOT NULL DEFAULT 0,
  salt_used_g NUMERIC(12,2) NOT NULL DEFAULT 0,
  preservatives_measure_g NUMERIC(12,2) NOT NULL DEFAULT 0,
  preservatives_used_g NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(log_date, product_type_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredient_usage_logs TO authenticated;
GRANT ALL ON public.ingredient_usage_logs TO service_role;
ALTER TABLE public.ingredient_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read ingredient_usage" ON public.ingredient_usage_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "prod/owner write ingredient_usage" ON public.ingredient_usage_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'production_staff'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'production_staff'));
CREATE TRIGGER trg_ingredient_usage_updated_at BEFORE UPDATE ON public.ingredient_usage_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- proforma_orders
-- =========================================================
CREATE TABLE public.proforma_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  product_type_id UUID REFERENCES public.product_types(id) ON DELETE SET NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','delivered','cancelled')),
  notes TEXT,
  logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proforma_orders TO authenticated;
GRANT ALL ON public.proforma_orders TO service_role;
ALTER TABLE public.proforma_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read proforma" ON public.proforma_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales/owner write proforma" ON public.proforma_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'sales_clerk'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'sales_clerk'));
CREATE TRIGGER trg_proforma_updated_at BEFORE UPDATE ON public.proforma_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- printing_jobs
-- =========================================================
CREATE TABLE public.printing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  item_type TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
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
CREATE POLICY "authenticated read printing" ON public.printing_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner/prod write printing" ON public.printing_jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'production_staff'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'production_staff'));
CREATE TRIGGER trg_printing_updated_at BEFORE UPDATE ON public.printing_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- finished_goods_stock
-- =========================================================
CREATE TABLE public.finished_goods_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id UUID NOT NULL UNIQUE REFERENCES public.product_types(id) ON DELETE CASCADE,
  quantity_in_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finished_goods_stock TO authenticated;
GRANT ALL ON public.finished_goods_stock TO service_role;
ALTER TABLE public.finished_goods_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read fgs" ON public.finished_goods_stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner/prod write fgs" ON public.finished_goods_stock FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'production_staff'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'production_staff'));
CREATE TRIGGER trg_fgs_updated_at BEFORE UPDATE ON public.finished_goods_stock
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed a finished_goods_stock row for each product_type
INSERT INTO public.finished_goods_stock (product_type_id)
SELECT id FROM public.product_types;

-- =========================================================
-- audit_logs
-- =========================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[]
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read audit" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert own audit" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE INDEX idx_audit_performed_at ON public.audit_logs(performed_at DESC);
CREATE INDEX idx_audit_table ON public.audit_logs(table_name);

-- Auto-fill user_id from auth.uid() on insert
CREATE OR REPLACE FUNCTION public.set_audit_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_audit_set_user_id BEFORE INSERT ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_user_id();
