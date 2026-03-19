const { createClient } = require('@libsql/client');

const db = createClient({
    url: 'libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw'
});

async function update() {
    try {
        console.log("🛠 Updating schema...");
        
        // Add columns to product_overrides
        await db.execute("ALTER TABLE product_overrides ADD COLUMN custom_image_url TEXT DEFAULT NULL");
        console.log("✅ Added custom_image_url to product_overrides");
        
        // Ensure game_settings has necessary columns
        try {
            await db.execute("ALTER TABLE game_settings ADD COLUMN custom_name TEXT DEFAULT NULL");
            console.log("✅ Added custom_name to game_settings");
        } catch (e) { console.log("ℹ️ custom_name might already exist"); }
        
        try {
            await db.execute("ALTER TABLE game_settings ADD COLUMN custom_image_url TEXT DEFAULT NULL");
            console.log("✅ Added custom_image_url to game_settings");
        } catch (e) { console.log("ℹ️ custom_image_url might already exist"); }
        
        // Add game_settings table if it doesn't exist (though it should)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS game_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id TEXT UNIQUE NOT NULL,
                custom_name TEXT,
                custom_image_url TEXT,
                profit_percent NUMERIC DEFAULT 0,
                profit_fixed NUMERIC DEFAULT 0,
                is_active INTEGER DEFAULT 1
            )
        `);
        console.log("✅ Table game_settings checked");

        // Ensure product_overrides table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS product_overrides (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id TEXT NOT NULL,
                original_price NUMERIC NOT NULL,
                selling_price NUMERIC,
                cost_price NUMERIC,
                discount_price NUMERIC,
                discount_start TEXT,
                discount_end TEXT,
                custom_image_url TEXT,
                UNIQUE(company_id, original_price)
            )
        `);
        console.log("✅ Table product_overrides checked");

        console.log("🚀 Schema update complete!");
    } catch (e) {
        console.error("❌ Schema update failed:", e);
    }
}

update();
