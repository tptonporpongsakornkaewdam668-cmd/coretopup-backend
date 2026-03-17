const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
    console.log("🚀 Updating discount_codes table schema...");
    
    // Check if columns exist and add them
    const sql = `
        ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS title TEXT;
        ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS image_url TEXT;
    `;

    // Note: Suapbase-js doesn't support raw SQL directly from the client for security.
    // However, for this environment, I'll attempt to use RPC if available or just proceed.
    // Since I can't run raw SQL via the client easily, I'll check if I can use a different approach.
    
    console.log("⚠️ Supabase client cannot run raw ALTER TABLE. Please use the Supabase Dashboard SQL Editor to run:");
    console.log(sql);
    
    // Instead, I'll just adjust the frontend to handle missing fields gracefully.
}

run();
