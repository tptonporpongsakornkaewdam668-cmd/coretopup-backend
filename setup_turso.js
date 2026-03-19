const { createClient } = require("@libsql/client");

const url = "libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw";

const db = createClient({ url, authToken });

async function setup() {
    console.log("🚀 Starting Turso Database Setup...");
    try {
        // 1. ตาราง Users
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                balance DECIMAL(15,2) DEFAULT 0.00,
                points INTEGER DEFAULT 0,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Table 'users' created.");

        // 2. ตาราง Orders (สำหรับ WePay และอื่นๆ)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                product_id TEXT,
                product_name TEXT,
                player_id TEXT,
                server TEXT,
                amount DECIMAL(10,2),
                status TEXT DEFAULT 'pending',
                transaction_id TEXT,
                provider TEXT DEFAULT 'wepay',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        console.log("✅ Table 'orders' created.");

        // 3. ตาราง History (ประวัติการเติมเงิน/ใช้จ่าย)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                type TEXT, -- topup, purchase
                amount DECIMAL(10,2),
                description TEXT,
                status TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        console.log("✅ Table 'history' created.");

        // 4. ตาราง Game Settings (กำไร/ราคา)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS game_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id TEXT UNIQUE,
                game_name TEXT,
                profit_percent DECIMAL(5,2) DEFAULT 0.00,
                profit_fixed DECIMAL(10,2) DEFAULT 0.00,
                is_active BOOLEAN DEFAULT 1
            )
        `);
        console.log("✅ Table 'game_settings' created.");

        // 5. ตาราง Sliders
        await db.execute(`
            CREATE TABLE IF NOT EXISTS sliders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                image_url TEXT,
                link TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Table 'sliders' created.");

        console.log("\n🎉 Database Setup Finished Successfully!");
    } catch (error) {
        console.error("❌ Setup Failed:", error);
    }
}

setup();
