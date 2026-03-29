require("dotenv").config();
const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");

const VPS_URL = process.env.DATABASE_URL || "http://157.85.102.141:8080";

console.log(`🚀 กำลัง Import ข้อมูลไปยัง VPS: ${VPS_URL}`);

const db = createClient({ url: VPS_URL });

async function importToVPS() {
    const sqlFile = path.join(__dirname, "dump.sql");
    if (!fs.existsSync(sqlFile)) {
        console.error("❌ ไม่พบไฟล์ dump.sql");
        process.exit(1);
    }

    const rawSQL = fs.readFileSync(sqlFile, "utf8");

    // แยก statements ออกจากกัน (split by ; แต่ระวัง multiline)
    // ตัด PRAGMA, BEGIN TRANSACTION, COMMIT ออก — libsql HTTP จัดการเองได้
    let statements = rawSQL
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .filter(s => !s.startsWith("--"))
        .filter(s => !/^(PRAGMA|BEGIN TRANSACTION|COMMIT)/i.test(s))
        .map(s => s.endsWith(";") ? s : s + ";");

    console.log(`📋 พบ ${statements.length} statements จะเริ่ม import...\n`);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.substring(0, 60).replace(/\n/g, " ");
        try {
            await db.execute(stmt);
            success++;
            if (stmt.startsWith("DROP") || stmt.startsWith("CREATE")) {
                console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`);
            }
        } catch (err) {
            failed++;
            console.error(`❌ [${i + 1}/${statements.length}] FAILED: ${preview}...`);
            console.error(`   Error: ${err.message}\n`);
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ สำเร็จ: ${success} statements`);
    console.log(`❌ ล้มเหลว: ${failed} statements`);
    console.log("=".repeat(50));

    // ตรวจสอบผลลัพธ์
    try {
        const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        console.log(`\n📦 ตารางทั้งหมดใน VPS: ${tables.rows.map(r => r.name).join(", ")}`);

        const users = await db.execute("SELECT count(*) as count FROM users");
        const orders = await db.execute("SELECT count(*) as count FROM orders");
        const gameSettings = await db.execute("SELECT count(*) as count FROM game_settings");
        console.log(`👥 Users: ${users.rows[0].count}`);
        console.log(`📦 Orders: ${orders.rows[0].count}`);
        console.log(`🎮 Game Settings: ${gameSettings.rows[0].count}`);
    } catch (err) {
        console.error("❌ ตรวจสอบผลลัพธ์ไม่ได้:", err.message);
    }

    process.exit(0);
}

importToVPS().catch(err => {
    console.error("❌ Fatal Error:", err);
    process.exit(1);
});
