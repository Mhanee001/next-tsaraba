
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('owner', 'production_staff', 'sales_clerk');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_read_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Owners can read all roles
CREATE POLICY "user_roles_owner_all" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'));

-- Handle new user: create profile + assign role (first user = owner, others = sales_clerk)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    assigned_role := 'owner';
  ELSE
    assigned_role := 'sales_clerk';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ RAW MATERIALS ============
CREATE TABLE public.raw_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unit',
  cost_per_unit NUMERIC(14,2) NOT NULL DEFAULT 0,
  quantity_in_stock NUMERIC(14,3) NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC(14,3) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.raw_materials TO authenticated;
GRANT ALL ON public.raw_materials TO service_role;
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "raw_materials_read" ON public.raw_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "raw_materials_owner_write" ON public.raw_materials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "raw_materials_prod_update" ON public.raw_materials FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'production_staff')) WITH CHECK (public.has_role(auth.uid(), 'production_staff'));
CREATE TRIGGER raw_materials_updated BEFORE UPDATE ON public.raw_materials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PRODUCTION LOGS ============
CREATE TABLE public.production_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift TEXT NOT NULL CHECK (shift IN ('morning','evening')),
  bags_produced INTEGER NOT NULL DEFAULT 0,
  damages INTEGER NOT NULL DEFAULT 0,
  carry_over_stock INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_logs TO authenticated;
GRANT ALL ON public.production_logs TO service_role;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prod_logs_read" ON public.production_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "prod_logs_insert" ON public.production_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'production_staff') OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "prod_logs_update_owner" ON public.production_logs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "prod_logs_delete_owner" ON public.production_logs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE TRIGGER prod_logs_updated BEFORE UPDATE ON public.production_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ AGENTS ============
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  commission_rate NUMERIC(6,3) NOT NULL DEFAULT 0, -- currency per bag OR percent (owner defines)
  credit_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents TO authenticated;
GRANT ALL ON public.agents TO service_role;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agents_read" ON public.agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "agents_owner_all" ON public.agents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "agents_clerk_update_credit" ON public.agents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'sales_clerk')) WITH CHECK (public.has_role(auth.uid(), 'sales_clerk'));
CREATE TRIGGER agents_updated BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SALES RECORDS ============
CREATE TABLE public.sales_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  sale_type TEXT NOT NULL CHECK (sale_type IN ('agent','factory','sales_point')),
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  gross_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  cash_collected NUMERIC(14,2) NOT NULL DEFAULT 0,
  credit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount NUMERIC(14,2) NOT NULL DEFAULT 0,
  damages INTEGER NOT NULL DEFAULT 0,
  returns INTEGER NOT NULL DEFAULT 0,
  commission_earned NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_records TO authenticated;
GRANT ALL ON public.sales_records TO service_role;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_read" ON public.sales_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales_insert" ON public.sales_records FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'sales_clerk') OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "sales_update_owner" ON public.sales_records FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "sales_delete_owner" ON public.sales_records FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE INDEX sales_records_agent_date ON public.sales_records(agent_id, sale_date DESC);
CREATE TRIGGER sales_updated BEFORE UPDATE ON public.sales_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ EXPENSES ============
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  description TEXT,
  logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_read" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'sales_clerk') OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(),'production_staff'));
CREATE POLICY "expenses_update_owner" ON public.expenses FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "expenses_delete_owner" ON public.expenses FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE TRIGGER expenses_updated BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CASH RECONCILIATION ============
CREATE TABLE public.cash_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recon_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  total_production_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_cash_collected NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_credit_issued NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_discounts NUMERIC(14,2) NOT NULL DEFAULT 0,
  expected_cash NUMERIC(14,2) NOT NULL DEFAULT 0,
  actual_cash_at_hand NUMERIC(14,2) NOT NULL DEFAULT 0,
  variance NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_reconciliation TO authenticated;
GRANT ALL ON public.cash_reconciliation TO service_role;
ALTER TABLE public.cash_reconciliation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recon_read" ON public.cash_reconciliation FOR SELECT TO authenticated USING (true);
CREATE POLICY "recon_write" ON public.cash_reconciliation FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'sales_clerk'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'sales_clerk'));
CREATE TRIGGER recon_updated BEFORE UPDATE ON public.cash_reconciliation
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PAYROLL ============
CREATE TABLE public.payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_date DATE NOT NULL DEFAULT CURRENT_DATE,
  staff_name TEXT NOT NULL,
  daily_wage NUMERIC(14,2) NOT NULL DEFAULT 0,
  meal_deduction NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_pay NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid','unpaid')),
  notes TEXT,
  logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_records TO authenticated;
GRANT ALL ON public.payroll_records TO service_role;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payroll_read" ON public.payroll_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "payroll_owner_all" ON public.payroll_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE TRIGGER payroll_updated BEFORE UPDATE ON public.payroll_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
