-- 아세아항공직업전문학교 명함 신청·관리 시스템 DB 스키마
-- Supabase PostgreSQL
-- monthly_invoices를 먼저 생성 (card_requests에서 참조)

CREATE TABLE monthly_invoices (
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

CREATE TABLE card_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- 신청자 정보
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

  -- 명함 옵션
  paper_type TEXT CHECK (paper_type IN ('premium', 'standard')) DEFAULT 'standard',
  is_bilingual BOOLEAN DEFAULT false,
  quantity INT DEFAULT 100,
  is_urgent BOOLEAN DEFAULT false,
  is_reorder BOOLEAN DEFAULT false,
  delivery_method TEXT CHECK (delivery_method IN ('pickup', 'delivery')) DEFAULT 'pickup',

  -- 상태
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','approved','revision','rejected',
    'ordered','printing','delivered_to_admin','delivered_to_applicant'
  )),

  -- 메모
  admin_note TEXT,
  vendor_note TEXT,
  order_note TEXT,
  deadline_date DATE,

  -- 히스토리 (상태변경 로그)
  status_history JSONB DEFAULT '[]'::jsonb,

  -- 금액
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  invoice_id UUID REFERENCES monthly_invoices(id),

  -- 인쇄용 파일
  print_file_url TEXT
);

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'vendor')) DEFAULT 'admin',
  telegram_chat_id TEXT,
  name TEXT
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_card_requests_updated_at
  BEFORE UPDATE ON card_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_invoices_updated_at
  BEFORE UPDATE ON monthly_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE card_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_invoices ENABLE ROW LEVEL SECURITY;

-- 신청자(anon): 삽입·조회 허용
CREATE POLICY "anon_insert" ON card_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_select" ON card_requests FOR SELECT USING (true);
CREATE POLICY "anon_update" ON card_requests FOR UPDATE USING (true);

-- monthly_invoices: 인증사용자 전체접근 + anon 조회
CREATE POLICY "anon_select_invoices" ON monthly_invoices FOR SELECT USING (true);
CREATE POLICY "auth_all_invoices" ON monthly_invoices FOR ALL USING (auth.role() = 'authenticated');

-- admin_users: 인증 사용자만
CREATE POLICY "auth_admin_users" ON admin_users FOR ALL USING (auth.role() = 'authenticated');
