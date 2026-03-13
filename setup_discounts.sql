-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fixed', 'percent')),
    value NUMERIC NOT NULL,
    min_order_amount NUMERIC DEFAULT 0,
    max_discount NUMERIC,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update Orders table to support discounts
ALTER TABLE IF EXISTS public.orders 
ADD COLUMN IF NOT EXISTS promo_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- Enable RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Create policies (Admin can do everything, users can read)
DROP POLICY IF EXISTS "Admin can do everything on discount_codes" ON discount_codes;
CREATE POLICY "Admin can do everything on discount_codes" 
ON discount_codes FOR ALL 
USING (true)
WITH CHECK (true);

-- Insert a sample code
INSERT INTO discount_codes (code, type, value, min_order_amount, is_active)
VALUES ('NEW2026', 'percent', 10, 100, true)
ON CONFLICT (code) DO NOTHING;
