const { createClient } = require('@libsql/client');

const db = createClient({
    url: 'libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw'
});

async function patch() {
    console.log("🚀 Starting Schema Patch (Absolute Fix)...");
    try {
        // 1. ตาราง users -> username
        console.log("-> Adding 'username' to users...");
        await db.execute("ALTER TABLE users ADD COLUMN username TEXT");
        
        // 2. ตาราง discount_codes -> created_at
        console.log("-> Adding 'created_at' to discount_codes...");
        await db.execute("ALTER TABLE discount_codes ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");

        // 3. ตาราง discount_codes -> title, description, image_url
        try {
            await db.execute("ALTER TABLE discount_codes ADD COLUMN title TEXT");
            await db.execute("ALTER TABLE discount_codes ADD COLUMN description TEXT");
            await db.execute("ALTER TABLE discount_codes ADD COLUMN image_url TEXT");
            console.log("-> Added extra metadata to discounts.");
        } catch (e) {
            console.log("ℹ️ Extra columns might already be there.");
        }

        console.log("✨ PATCH SUCCESS! Please restart admin page.");
    } catch (err) {
        console.error("❌ Patch Failed:", err.message, err);
    }
}
patch();
