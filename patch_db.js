const { createClient } = require('@libsql/client');

const db = createClient({
    url: 'libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiA01MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw'
});

async function patch() {
    console.log("🚀 Starting Schema Patch...");
    try {
        // 1. ตรวจสอบและเพิ่มคอลัมน์ username ใน table: users
        try {
            await db.execute("ALTER TABLE users ADD COLUMN username TEXT");
            console.log("✅ Added 'username' column to 'users' table.");
        } catch (e) {
            console.log("ℹ️ 'username' column already exists or skip if error.");
        }

        // 2. ตรวจสอบและเพิ่มคอลัมน์อื่นๆ ใน table: discount_codes
        try {
            await db.execute("ALTER TABLE discount_codes ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
            console.log("✅ Added 'created_at' column to 'discount_codes' table.");
        } catch (e) {
            console.log("ℹ️ 'created_at' column already exists or skip if error.");
        }

        // 3. แถมคอลัมน์สำคัญอื่นๆ เผื่อขาด
        try {
            await db.execute("ALTER TABLE discount_codes ADD COLUMN title TEXT");
            await db.execute("ALTER TABLE discount_codes ADD COLUMN description TEXT");
            console.log("✅ Added extra metadata columns to 'discount_codes'.");
        } catch (e) { }

        console.log("✨ PATCH COMPLETE! Please refresh and check your backend.");
    } catch (err) {
        console.error("❌ Patch Failed:", err);
    }
}

patch();
