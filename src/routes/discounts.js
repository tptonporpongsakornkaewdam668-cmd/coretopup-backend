const express = require("express");
const { db } = require("../db");

const router = express.Router();

// GET /api/discounts - List all active discounts publicly
router.get("/", async (req, res) => {
    try {
        const result = await db.execute({
            sql: "SELECT * FROM discount_codes WHERE is_active = 1 AND (end_date IS NULL OR end_date >= datetime('now')) ORDER BY created_at DESC",
            args: []
        });
        
        const activeDiscounts = result.rows.filter(d => {
            if (d.usage_limit && d.usage_count >= d.usage_limit) return false;
            return true;
        });

        res.json({ success: true, data: activeDiscounts });
    } catch (err) {
        console.error("❌ Public Discounts Fetch Error:", err);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการโหลดข้อมูลส่วนลด" });
    }
});

module.exports = router;
