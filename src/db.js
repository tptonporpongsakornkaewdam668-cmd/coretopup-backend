require("dotenv").config();
const { createClient } = require("@libsql/client");

// ลำดับการเลือก Database:
// 1. เลือกจาก DATABASE_URL ใน .env (เช่น http://157.85.102.141:8080 หรือ file:./database.sqlite)
// 2. ถ้าไม่มีให้ใช้ TURSO_DATABASE_URL เดิม
const dbUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || "libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io";
const dbToken = process.env.TURSO_AUTH_TOKEN || "";

const dbConfig = {
    url: dbUrl,
};

// ใส่ authToken เฉพาะเมื่อมีค่าจริงๆ (ไม่ใส่ถ้าเป็น empty string)
if (dbToken && dbToken.length > 0) {
    dbConfig.authToken = dbToken;
}

const db = createClient(dbConfig);

console.log(`🗄️  Database connecting to: ${dbUrl.startsWith("file:") ? dbUrl : dbUrl.replace(/\/\/.*@/, "//***@")}`);

module.exports = { supabase: db, db };
