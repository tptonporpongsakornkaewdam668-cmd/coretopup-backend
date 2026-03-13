-- รัน SQL นี้ใน Supabase SQL Editor
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_data TEXT DEFAULT NULL;
