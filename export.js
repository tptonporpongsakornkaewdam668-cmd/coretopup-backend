const { db } = require('./src/db');
const fs = require('fs');

async function exportDatabase() {
    console.log("🚀 กำลังเริ่มดึงข้อมูลจาก Turso...");
    try {
        // 1. ดึงรายชื่อตารางทั้งหมด (ยกเว้นตารางระบบ sqlite)
        const tablesRes = await db.execute({
            sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
            args: []
        });
        const tables = tablesRes.rows;

        let sqlDump = "PRAGMA foreign_keys=OFF;\nBEGIN TRANSACTION;\n\n";

        for (const table of tables) {
            const tableName = table.name;
            console.log(`📦 กำลังดึงตาราง: ${tableName}`);
            
            try {
                // 2. ดึง Schema (คำสั่ง CREATE TABLE)
                const schemaRes = await db.execute({
                    sql: `SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`,
                    args: []
                });
                
                if (schemaRes.rows.length === 0) continue;
                
                sqlDump += `DROP TABLE IF EXISTS ${tableName};\n`;
                sqlDump += schemaRes.rows[0].sql + ";\n";

                // 3. ดึงข้อมูลในตาราง
                const dataRes = await db.execute({
                    sql: `SELECT * FROM ${tableName}`,
                    args: []
                });
                
                for (const row of dataRes.rows) {
                    const keys = Object.keys(row);
                    if (keys.length === 0) continue;

                    const values = keys.map(key => {
                        const val = row[key];
                        if (val === null || val === undefined) return "NULL";
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        if (typeof val === 'number') return val;
                        if (typeof val === 'boolean') return val ? 1 : 0;
                        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                        return `'${String(val).replace(/'/g, "''")}'`;
                    }).join(", ");
                    
                    sqlDump += `INSERT INTO ${tableName} (${keys.join(", ")}) VALUES (${values});\n`;
                }
                sqlDump += "\n";
            } catch (tableError) {
                console.error(`❌ เกิดข้อผิดพลาดในตาราง ${tableName}:`, tableError.message);
            }
        }

        sqlDump += "COMMIT;";
        fs.writeFileSync('dump.sql', sqlDump);
        console.log("------------------------------------------");
        console.log("✅ ดึงข้อมูลสำเร็จ! ได้ไฟล์ชื่อ 'dump.sql' แล้วครับ");
        console.log("📍 ตำแหน่งไฟล์: " + process.cwd() + "\\dump.sql");
        console.log("------------------------------------------");
        process.exit(0);
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
        process.exit(1);
    }
}

exportDatabase();
