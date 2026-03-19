require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ SUPABASE_URL หรือ SUPABASE_KEY ไม่ได้กำหนดใน Environment Variables (Vercel Settings) หรือ .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };

