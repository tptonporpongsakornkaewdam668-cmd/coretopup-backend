const express = require("express");
const crypto = require("crypto");
const { db } = require("../db");
const { authenticateAdmin } = require("../middleware/adminAuth");
const { createFiveMPurchase, initFiveMTables } = require("../services/fivemService");

const router = express.Router();

// Init tables on startup
initFiveMTables().catch(console.error);

// ─── Middleware: Authenticate User ────────────────────────────────────────────
const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "กรุณาเข้าสู่ระบบก่อน" });
    }
    try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ success: false, message: "Token ไม่ถูกต้องหรือหมดอายุ" });
    }
};

// ─── GET /api/fivem/packages — Public ────────────────────────────────────────
router.get("/packages", async (req, res) => {
    try {
        const result = await db.execute(
            "SELECT * FROM fivem_packages WHERE is_active = 1 ORDER BY price ASC"
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── POST /api/fivem/packages — Admin: สร้างแพ็กเกจ ─────────────────────────
router.post("/packages", authenticateAdmin, async (req, res) => {
    try {
        const { name, description, price, image_url, fivem_amount } = req.body;
        if (!name || !price || !fivem_amount) {
            return res.status(400).json({ success: false, message: "กรุณากรอก ชื่อ, ราคา และ จำนวน" });
        }
        const result = await db.execute({
            sql: `INSERT INTO fivem_packages (name, description, price, image_url, fivem_amount)
                  VALUES (?, ?, ?, ?, ?)`,
            args: [name, description || null, parseFloat(price), image_url || null, parseInt(fivem_amount)],
        });
        res.status(201).json({ success: true, message: "สร้างแพ็กเกจสำเร็จ", id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── PATCH /api/fivem/packages/:id — Admin: แก้ไข ───────────────────────────
router.patch("/packages/:id", authenticateAdmin, async (req, res) => {
    try {
        const { name, description, price, image_url, fivem_amount, is_active } = req.body;
        await db.execute({
            sql: `UPDATE fivem_packages SET
                    name = COALESCE(?, name),
                    description = COALESCE(?, description),
                    price = COALESCE(?, price),
                    image_url = COALESCE(?, image_url),
                    fivem_amount = COALESCE(?, fivem_amount),
                    is_active = COALESCE(?, is_active),
                    updated_at = CURRENT_TIMESTAMP
                  WHERE id = ?`,
            args: [
                name || null,
                description || null,
                price ? parseFloat(price) : null,
                image_url !== undefined ? (image_url || null) : null,
                fivem_amount ? parseInt(fivem_amount) : null,
                is_active !== undefined ? (is_active ? 1 : 0) : null,
                req.params.id,
            ],
        });
        res.json({ success: true, message: "อัปเดตแพ็กเกจสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── DELETE /api/fivem/packages/:id — Admin: ลบ ─────────────────────────────
router.delete("/packages/:id", authenticateAdmin, async (req, res) => {
    try {
        await db.execute({ sql: "DELETE FROM fivem_packages WHERE id = ?", args: [req.params.id] });
        res.json({ success: true, message: "ลบแพ็กเกจสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── POST /api/fivem/purchase — User: ซื้อ ───────────────────────────────────
// Flow: ตัดยอดเงิน → สร้าง Key → ส่งไปยัง Webhook (ถ้าตั้งค่าไว้) → คืน Key ให้ผู้ใช้
router.post("/purchase", authenticateUser, async (req, res) => {
    try {
        const { package_id } = req.body;
        if (!package_id) {
            return res.status(400).json({ success: false, message: "กรุณาระบุ package_id" });
        }

        const userId = req.user.id;

        const userRes = await db.execute({
            sql: "SELECT balance FROM users WHERE id = ? LIMIT 1",
            args: [userId],
        });
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "ไม่พบข้อมูลผู้ใช้" });
        }

        const pkgRes = await db.execute({
            sql: "SELECT * FROM fivem_packages WHERE id = ? AND is_active = 1 LIMIT 1",
            args: [package_id],
        });
        if (pkgRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "ไม่พบแพ็กเกจ" });
        }

        const balance = parseFloat(userRes.rows[0].balance || 0);
        const pkg = pkgRes.rows[0];
        const price = parseFloat(pkg.price);

        if (balance < price) {
            return res.status(400).json({
                success: false,
                message: `ยอดเงินไม่เพียงพอ (มี ฿${balance.toLocaleString()} ต้องการ ฿${price.toLocaleString()})`,
            });
        }

        // ตัดยอดเงิน
        await db.execute({
            sql: "UPDATE users SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            args: [price, userId],
        });

        const orderRef = `FIVEM-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

        // สร้าง Key + ส่ง Webhook
        const purchaseResult = await createFiveMPurchase(package_id, userId, orderRef);

        // บันทึก Order (non-blocking)
        db.execute({
            sql: `INSERT INTO orders (id, user_id, amount, status, type, reference, description, created_at)
                  VALUES (?, ?, ?, 'completed', 'fivem', ?, ?, CURRENT_TIMESTAMP)`,
            args: [crypto.randomUUID(), userId, price, orderRef, `FiveM Key: ${purchaseResult.key} | ${pkg.name}`],
        }).catch(() => {});

        res.json({
            success: true,
            message: "ซื้อแพ็กเกจสำเร็จ! 🎉",
            data: {
                key: purchaseResult.key,
                package: pkg.name,
                fivem_amount: pkg.fivem_amount,
                order_ref: orderRef,
                webhook_sent: purchaseResult.webhookSent,
            },
        });
    } catch (err) {
        console.error("❌ FiveM Purchase Error:", err);
        res.status(500).json({ success: false, message: err.message || "เกิดข้อผิดพลาด" });
    }
});

// ─── GET /api/fivem/keys — Admin: รายการ Key ────────────────────────────────
router.get("/keys", authenticateAdmin, async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT fk.*, fp.name as package_name, fp.price as package_price
            FROM fivem_keys fk
            LEFT JOIN fivem_packages fp ON fk.package_id = fp.id
            ORDER BY fk.created_at DESC
            LIMIT 200
        `);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/fivem/stats — Admin: สถิติ ───────────────────────────────────
router.get("/stats", authenticateAdmin, async (req, res) => {
    try {
        const keysRes = await db.execute(
            "SELECT status, COUNT(*) as count FROM fivem_keys GROUP BY status"
        );
        const revenueRes = await db.execute(`
            SELECT COALESCE(SUM(fp.price), 0) as total
            FROM fivem_keys fk
            JOIN fivem_packages fp ON fk.package_id = fp.id
        `);
        res.json({
            success: true,
            data: { keys: keysRes.rows, revenue: revenueRes.rows[0]?.total || 0 },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/fivem/my-keys — User: Key ของฉัน ──────────────────────────────
router.get("/my-keys", authenticateUser, async (req, res) => {
    try {
        const result = await db.execute({
            sql: `SELECT fk.*, fp.name as package_name, fp.fivem_amount, fp.price
                  FROM fivem_keys fk
                  JOIN fivem_packages fp ON fk.package_id = fp.id
                  WHERE fk.user_id = ?
                  ORDER BY fk.created_at DESC`,
            args: [req.user.id],
        });
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
