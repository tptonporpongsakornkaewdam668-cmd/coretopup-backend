const express = require("express");
const { authenticate } = require("../middleware/auth");
const { db } = require("../db");

const router = express.Router();

/**
 * รวมประวัติทุกอย่างของผู้ใช้ออกมาที่เดียว (Consolidated History)
 */
router.get("/", authenticate, async (req, res) => {
    try {
        // 1. ดึงประวัติการสั่งซื้อ (Orders)
        const ordersRes = await db.execute({
            sql: "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
            args: [req.user.id]
        });

        // 2. ดึงประวัติการเติมเงิน (Top-ups) จากตาราง topups
        let topups = [];
        try {
            const topupsRes = await db.execute({
                sql: "SELECT * FROM topups WHERE user_id = ? ORDER BY created_at DESC",
                args: [req.user.id]
            });
            topups = topupsRes.rows;
        } catch (e) {
            console.warn("⚠️ Topups table not ready or empty.");
        }

        const historyObj = {
            purchases: ordersRes.rows || [],
            topups: topups || []
        };

        res.json({
            success: true,
            data: historyObj
        });
    } catch (err) {
        console.error("❌ History fetch error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
