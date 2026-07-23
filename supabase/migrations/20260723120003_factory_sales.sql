-- ============ FACTORY SALES ============
CREATE TABLE public.factory_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
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
CREATE POLICY "factory_sales_read" ON public.factory_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "factory_sales_insert" ON public.factory_sales FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'sales_clerk') OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "factory_sales_update_owner" ON public.factory_sales FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "factory_sales_delete_owner" ON public.factory_sales FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE INDEX factory_sales_date ON public.factory_sales(sale_date DESC);
CREATE TRIGGER factory_sales_updated BEFORE UPDATE ON public.factory_sales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SEED RAW MATERIALS ============
INSERT INTO public.raw_materials (name, unit, cost_per_unit, quantity_in_stock, low_stock_threshold)
SELECT * FROM (VALUES
  ('FLOUR', 'bag', 38500, 300, 50),
  ('SUGAR', 'bag', 48500, 100, 20),
  ('SALT', 'bag', 14500, 50, 10),
  ('PRESERVATIVES', 'bag', 28000, 30, 5)
) AS v(name, unit, cost_per_unit, quantity_in_stock, low_stock_threshold)
WHERE NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE name = v.name);
