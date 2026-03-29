require('dotenv').config({ path: 'd:/gametopup/gametopup backend/.env' });
const { createClient } = require("@libsql/client");

const tursoUrl = process.env.TURSO_DATABASE_URL || "libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io";
const tursoToken = process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw";

const db = createClient({
    url: tursoUrl,
    authToken: tursoToken,
});

async function setupApiKeys() {
    try {
        console.log("🚀 Initializing API Keys Table at " + tursoUrl);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS api_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT, -- Fixed for libsql
                name TEXT NOT NULL,
                key TEXT UNIQUE NOT NULL,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used_at DATETIME
            )
        `);
        console.log("✅ API Keys Table ready.");
        
        const result = await db.execute("SELECT COUNT(*) as cnt FROM api_keys");
        if (result.rows[0].cnt === 0) {
            console.log("➕ Adding default API Key...");
            const defaultKey = process.env.REDEEM_API_KEY || "CZ-RD-99XA-2J88-SNPE";
            await db.execute({
                sql: "INSERT INTO api_keys (name, key, status) VALUES (?, ?, ?)",
                args: ["Default FiveM Server", defaultKey, "active"]
            });
            console.log("✅ Default key added.");
        }
    } catch (err) {
        console.error("❌ DB Finalization Error:", err);
    }
}

setupApiKeys();
