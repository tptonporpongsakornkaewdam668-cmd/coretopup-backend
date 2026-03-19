const { createClient } = require('@libsql/client');

const db = createClient({
    url: 'libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw'
});

async function patch() {
    console.log("🚀 Patching missing updated_at columns...");
    try {
        // 1. users
        try {
            await db.execute("ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
            console.log("✅ Added 'updated_at' to users.");
        } catch (e) { console.log("ℹ️ 'updated_at' exists in users or error."); }

        // 2. orders
        try {
            await db.execute("ALTER TABLE orders ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
            console.log("✅ Added 'updated_at' to orders.");
        } catch (e) { console.log("ℹ️ 'updated_at' exists in orders or error."); }

        // 3. discount_codes
        try {
            await db.execute("ALTER TABLE discount_codes ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
            console.log("✅ Added 'updated_at' to discount_codes.");
        } catch (e) { }

        console.log("✨ PATCH SUCCESS! Please try to purchase again.");
    } catch (err) {
        console.error("❌ Final Patch Failed:", err);
    }
}
patch();
