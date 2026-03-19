const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { authenticate } = require("../middleware/auth");
const { orderLimiter } = require("../middleware/rateLimiter");
const { orderRules } = require("../middleware/validate");
const { db } = require("../db");

const router = express.Router();
const { updateBalance, getBalance } = require("../services/wallet");

// ─── POST /api/orders ─────────────────────────────────────────────────────────
router.post("/", authenticate, orderLimiter, orderRules, async (req, res) => {
    const {
        gameSlug,
        gameName,
        packageId,
        packageName,
        packagePrice,
        playerId,
        server
    } = req.body;

    try {
        const currentBalance = await getBalance(req.user.id);
        if (currentBalance < packagePrice) {
            return res.status(400).json({
                success: false,
                message: `ยอดเงินไม่เพียงพอ (คงเหลือ: ${currentBalance.toFixed(2)} บาท, ราคาสินค้า: ${packagePrice.toFixed(2)} บาท)`
            });
        }

        await updateBalance(req.user.id, -packagePrice, `ซื้อสินค้า ${gameName}: ${packageName}`);

        const orderId = uuidv4();
        await db.execute({
            sql: `INSERT INTO orders (id, user_id, user_email, product_id, product_name, amount, player_id, server, status, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            args: [
                orderId,
                req.user.id,
                req.user.email || "user@example.com",
                String(packageId),
                `${gameName} - ${packageName}`,
                Number(packagePrice),
                String(playerId),
                server || "-",
                "pending"
            ]
        });

        console.log(`📦 Order Created [${orderId}]: ${gameName} for ${req.user.email}`);

        res.status(201).json({
            success: true,
            message: "สั่งซื้อสำเร็จ ระบบกำลังดำเนินการ",
            data: { id: orderId, status: "pending" },
        });
    } catch (err) {
        console.error("❌ Order Processing Error:", err.message);
        res.status(500).json({ success: false, message: err.message || "เกิดข้อผิดพลาดภายในระบบ" });
    }
});

// ─── GET /api/orders/my ───────────────────────────────────────────────────────
router.get("/my", authenticate, async (req, res) => {
    try {
        const result = await db.execute({
            sql: "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
            args: [req.user.id]
        });
        const myOrders = result.rows;

        res.json({ success: true, data: myOrders, count: myOrders.length });
    } catch (error) {
        console.error("Turso Get Orders Error:", error);
        return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }
});

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
router.get("/:id", authenticate, async (req, res) => {
    try {
        const result = await db.execute({
            sql: "SELECT * FROM orders WHERE id = ? LIMIT 1",
            args: [req.params.id]
        });
        const order = result.rows[0];

        if (!order) {
            return res.status(404).json({ success: false, message: "ไม่พบ Order นี้" });
        }
        if (order.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: "ไม่มีสิทธิ์ดู Order นี้" });
        }

        res.json({ success: true, data: order });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
