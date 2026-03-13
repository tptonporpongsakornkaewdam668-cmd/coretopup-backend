-- 1. Create System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Add Points to Users table
ALTER TABLE IF EXISTS public.users 
ADD COLUMN IF NOT EXISTS points NUMERIC DEFAULT 0;

-- 3. Add Earned Points to Orders table
ALTER TABLE IF EXISTS public.orders 
ADD COLUMN IF NOT EXISTS earned_points NUMERIC DEFAULT 0;

-- 4. Initial Settings Data
INSERT INTO public.system_settings (key, value) VALUES 
('agreement_text', 'ข้อตกลงและเงื่อนไขการใช้บริการ: \n1. การเติมเงินไม่สามารถยกเลิกได้\n2. โปรดตรวจสอบ ID ของคุณให้ถูกต้อง\n3. ระบบจะดำเนินการภายใน 1-15 นาที'),
('point_earn_rate', '1'), -- 1 point per 100 THB (we will handle the logic in code)
('point_earn_threshold', '100'), -- Amount needed to earn points
('point_redeem_rate', '0.1') -- 1 point = 0.1 THB discount
ON CONFLICT (key) DO NOTHING;
