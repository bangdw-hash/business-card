-- =====================================================
-- 아세아항공직업전문학교 명함 신청 관리 시스템
-- Supabase PostgreSQL Schema
-- =====================================================

-- Enable UUID extension (already enabled in Supabase by default)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. monthly_invoices (must be created FIRST)
-- =====================================================
CREATE TABLE IF NOT EXISTS monthly_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  invoice_year INT NOT NULL,
  invoice_month INT NOT NULL,
  total_orders INT DEFAULT 0,
  total_quantity INT DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid')),
  payment_due_date DATE,
  payment_date DATE,
  admin_note TEXT,
  vendor_note TEXT,
  UNIQUE(invoice_year, invoice_month)
);

-- =====================================================
-- 2. card_requests
-- =====================================================
CREATE TABLE IF NOT EXISTS card_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  applicant_name TEXT NOT NULL,
  applicant_name_en TEXT,
  department TEXT NOT NULL,
  department_en TEXT,
  position_kr TEXT NOT NULL,
  position_en TEXT,
  phone TEXT,
  mobile TEXT,
  fax TEXT,
  email TEXT NOT NULL,
  extension TEXT,
  address TEXT DEFAULT '서울특별시 강서구 오쇠로 56 (아세아항공직업전문학교)',
  address_en TEXT DEFAULT '56, Osoe-ro, Gangseo-gu, Seoul, Republic of Korea',
  paper_type TEXT CHECK (paper_type IN ('premium', 'standard')) DEFAULT 'standard',
  is_bilingual BOOLEAN DEFAULT false,
  quantity INT DEFAULT 100,
  is_urgent BOOLEAN DEFAULT false,
  is_reorder BOOLEAN DEFAULT false,
  delivery_method TEXT CHECK (delivery_method IN ('pickup', 'delivery')) DEFAULT 'pickup',
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','approved','revision','rejected',
    'ordered','printing','delivered_to_admin','delivered_to_applicant'
  )),
  admin_note TEXT,
  vendor_note TEXT,
  order_note TEXT,
  deadline_date DATE,
  status_history JSONB DEFAULT '[]'::jsonb,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  invoice_id UUID REFERENCES monthly_invoices(id),
  print_file_url TEXT
);

-- =====================================================
-- 3. admin_users
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'vendor')) DEFAULT 'admin',
  telegram_chat_id TEXT,
  name TEXT
);

-- =====================================================
-- 4. Triggers for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_monthly_invoices_updated_at
  BEFORE UPDATE ON monthly_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_card_requests_updated_at
  BEFORE UPDATE ON card_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. Row Level Security (RLS)
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE monthly_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Permissive policies using anon key (server-side validation in app)
-- card_requests: allow all for anon (form submissions from public)
CREATE POLICY "allow_anon_select_card_requests"
  ON card_requests FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "allow_anon_insert_card_requests"
  ON card_requests FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "allow_anon_update_card_requests"
  ON card_requests FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- authenticated users (admin) full access
CREATE POLICY "allow_authenticated_all_card_requests"
  ON card_requests FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- monthly_invoices: allow select for anon (vendor view)
CREATE POLICY "allow_anon_select_monthly_invoices"
  ON monthly_invoices FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "allow_anon_insert_monthly_invoices"
  ON monthly_invoices FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "allow_anon_update_monthly_invoices"
  ON monthly_invoices FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_authenticated_all_monthly_invoices"
  ON monthly_invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- admin_users: authenticated only
CREATE POLICY "allow_authenticated_all_admin_users"
  ON admin_users FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 6. Indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_card_requests_status ON card_requests(status);
CREATE INDEX IF NOT EXISTS idx_card_requests_email ON card_requests(email);
CREATE INDEX IF NOT EXISTS idx_card_requests_applicant_name ON card_requests(applicant_name);
CREATE INDEX IF NOT EXISTS idx_card_requests_created_at ON card_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_card_requests_invoice_id ON card_requests(invoice_id);
CREATE INDEX IF NOT EXISTS idx_monthly_invoices_year_month ON monthly_invoices(invoice_year, invoice_month);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
