const { createClient } = require('@libsql/client');

const db = createClient({
    url: 'libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw'
});

async function fix() {
    console.log("🚀 Starting Turso Table Fix (Retry)...");
    try {
        await db.execute(`CREATE TABLE IF NOT EXISTS sliders (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            image_url TEXT, 
            link_url TEXT, 
            order_index INTEGER DEFAULT 0, 
            is_active INTEGER DEFAULT 1, 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log("✅ Sliders table checked/created.");

        await db.execute(`CREATE TABLE IF NOT EXISTS game_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            company_id TEXT UNIQUE, 
            custom_name TEXT, 
            custom_image_url TEXT, 
            updated_at DATETIME
        )`);
        console.log("✅ Game Settings table checked/created.");

        const countRes = await db.execute("SELECT count(*) as count FROM sliders");
        if (countRes.rows[0].count === 0) {
            await db.execute("INSERT INTO sliders (image_url, is_active) VALUES ('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200', 1)");
            console.log("✅ Added first dummy slider.");
        }

        console.log("✨ ALL DONE! Please refresh your website.");
    } catch (e) {
        console.error("❌ Fix Failed:", e);
    }
}

fix();
