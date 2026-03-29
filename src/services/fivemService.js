const crypto = require("crypto");
const { db } = require("../db");

// ─── Initialize FiveM Tables ──────────────────────────────────────────────────
const initFiveMTables = async () => {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS fivem_packages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            image_url TEXT,
            fivem_amount INTEGER NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS fivem_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key_code TEXT NOT NULL UNIQUE,
            package_id INTEGER NOT NULL,
            user_id TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            order_ref TEXT,
            used_at DATETIME,
            webhook_response TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (package_id) REFERENCES fivem_packages(id)
        )
    `);

    console.log("✅ FiveM tables initialized");
};

// ─── Generate Secure Key ──────────────────────────────────────────────────────
const generateFiveMKey = () => {
    const part = () => crypto.randomBytes(3).toString("hex").toUpperCase();
    return `FIVEM-${part()}-${part()}-${part()}-${part()}`;
};

// ─── Notify External Webhook (Optional) ──────────────────────────────────────
// ส่งข้อมูล Key ไปยังระบบอื่นที่ผู้ดูแลกำหนดไว้ใน .env
// ถ้าไม่ได้ตั้งค่า FIVEM_WEBHOOK_URL ระบบจะข้ามขั้นตอนนี้
const notifyWebhook = async (keyCode, packageData, userId, orderRef) => {
    const webhookUrl = process.env.FIVEM_WEBHOOK_URL;

    if (!webhookUrl) {
        console.info("ℹ️  FIVEM_WEBHOOK_URL ไม่ได้ตั้งค่า — ข้ามการแจ้งเตือน");
        return { success: false, skipped: true, message: "Webhook URL not configured" };
    }

    try {
        const payload = {
            event: "purchase.completed",
            key: keyCode,
            order_ref: orderRef,
            package: {
                id: packageData.id,
                name: packageData.name,
                fivem_amount: packageData.fivem_amount,
                price: packageData.price,
            },
            user_id: userId || null,
            timestamp: new Date().toISOString(),
        };

        // สร้าง Signature เพื่อให้ปลายทางตรวจสอบว่าข้อมูลมาจากระบบนี้จริง
        const secret = process.env.FIVEM_WEBHOOK_SECRET || "";
        const signature = secret
            ? crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex")
            : "";

        const headers = {
            "Content-Type": "application/json",
        };
        if (signature) headers["X-Signature"] = `sha256=${signature}`;
        if (secret)    headers["X-Secret"]    = secret;         // บางระบบรับแบบ header โดยตรง

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(8000),
        });

        let result;
        try { result = await response.json(); } catch { result = { raw: "non-json response" }; }

        console.log(`📤 Webhook → ${webhookUrl} | Status: ${response.status}`);
        return { success: response.ok, status: response.status, data: result };

    } catch (err) {
        console.warn("⚠️ Webhook ส่งล้มเหลว (ไม่กระทบการออก Key):", err.message);
        return { success: false, error: err.message };
    }
};

// ─── Create Purchase ──────────────────────────────────────────────────────────
// 1. ดึงแพ็กเกจ → 2. สร้าง Key → 3. แจ้ง Webhook → 4. บันทึก DB
const createFiveMPurchase = async (packageId, userId, orderRef) => {
    // 1. ดึงข้อมูลแพ็กเกจ
    const pkgRes = await db.execute({
        sql: "SELECT * FROM fivem_packages WHERE id = ? AND is_active = 1 LIMIT 1",
        args: [packageId],
    });
    if (pkgRes.rows.length === 0) throw new Error("ไม่พบแพ็กเกจหรือแพ็กเกจถูกปิดใช้งาน");
    const pkg = pkgRes.rows[0];

    // 2. สร้าง Key ที่ไม่ซ้ำกัน
    let keyCode = "";
    for (let i = 0; i < 10; i++) {
        const candidate = generateFiveMKey();
        const existing = await db.execute({
            sql: "SELECT id FROM fivem_keys WHERE key_code = ?",
            args: [candidate],
        });
        if (existing.rows.length === 0) { keyCode = candidate; break; }
    }
    if (!keyCode) throw new Error("ไม่สามารถสร้าง Key ได้ กรุณาลองใหม่");

    // 3. แจ้ง Webhook (ไม่ block การออก Key ถ้า Webhook ล้มเหลว)
    const webhookResult = await notifyWebhook(keyCode, pkg, userId, orderRef);

    // 4. บันทึก Key ลง DB
    await db.execute({
        sql: `INSERT INTO fivem_keys
              (key_code, package_id, user_id, status, order_ref, webhook_response, created_at)
              VALUES (?, ?, ?, 'active', ?, ?, CURRENT_TIMESTAMP)`,
        args: [
            keyCode,
            packageId,
            userId || null,
            orderRef || null,
            JSON.stringify(webhookResult),
        ],
    });

    return {
        key: keyCode,
        package: pkg,
        webhookSent: webhookResult.success,
        webhookSkipped: webhookResult.skipped || false,
    };
};

module.exports = { initFiveMTables, generateFiveMKey, notifyWebhook, createFiveMPurchase };
