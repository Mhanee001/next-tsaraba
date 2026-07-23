
-- ============ PRODUCT TYPES ============
CREATE TABLE public.product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_types TO authenticated;
GRANT ALL ON public.product_types TO service_role;
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_types_read" ON public.product_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_types_owner_write" ON public.product_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "product_types_prod_update" ON public.product_types FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'production_staff')) WITH CHECK (public.has_role(auth.uid(), 'production_staff'));
CREATE TRIGGER product_types_updated BEFORE UPDATE ON public.product_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- seed standard product types
INSERT INTO public.product_types (name) VALUES
  ('COCOANUT'),
  ('TOP'),
  ('SUPPER'),
  ('EXECUTIVE'),
  ('BROWN'),
  ('ROUND'),
  ('NATURE'),
  ('MACRO'),
  ('DOUGHNUT');

-- ============ INGREDIENT USAGE LOGS ============
CREATE TABLE public.ingredient_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  product_type_id UUID NOT NULL REFERENCES public.product_types(id) ON DELETE CASCADE,
  flour_bags NUMERIC(6,2) NOT NULL DEFAULT 0,
  flour_measure_g NUMERIC(10,2) NOT NULL DEFAULT 0,
  flour_used_g NUMERIC(10,2) NOT NULL DEFAULT 0,
  sugar_measure_g NUMERIC(10,2) NOT NULL DEFAULT 0,
  sugar_used_g NUMERIC(10,2) NOT NULL DEFAULT 0,
  salt_measure_g NUMERIC(10,2) NOT NULL DEFAULT 0,
  salt_used_g NUMERIC(10,2) NOT NULL DEFAULT 0,
  preservatives_measure_g NUMERIC(10,2) NOT NULL DEFAULT 0,
  preservatives_used_g NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(log_date, product_type_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredient_usage_logs TO authenticated;
GRANT ALL ON public.ingredient_usage_logs TO service_role;
ALTER TABLE public.ingredient_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ingredient_usage_read" ON public.ingredient_usage_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "ingredient_usage_insert" ON public.ingredient_usage_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'production_staff') OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "ingredient_usage_update_owner" ON public.ingredient_usage_logs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "ingredient_usage_delete_owner" ON public.ingredient_usage_logs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE INDEX ingredient_usage_date ON public.ingredient_usage_logs(log_date DESC);
CREATE TRIGGER ingredient_usage_updated BEFORE UPDATE ON public.ingredient_usage_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
