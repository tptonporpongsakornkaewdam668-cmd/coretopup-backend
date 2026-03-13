const express = require("express");
const { authenticate } = require("../middleware/auth");
const { supabase } = require("../db");

const router = express.Router();

/**
 * รวมประวัติทุกอย่างของผู้ใช้ออกมาที่เดียว (Consolidated History)
 */
router.get("/", authenticate, async (req, res) => {
    try {
        // 1. ดึงประวัติการสั่งซื้อ (Orders)
        const { data: orders, error: orderError } = await supabase
            .from("orders")
            .select("*")
            .eq("user_id", req.user.id)
            .order("created_at", { ascending: false });

        // 2. ดึงประวัติการเติมเงิน (Top-ups)
        const { data: topups, error: topupError } = await supabase
            .from("topups")
            .select("*")
            .eq("user_id", req.user.id)
            .order("created_at", { ascending: false });

        if (orderError || topupError) {
            throw new Error("เกิดข้อผิดพลาดในการดึงประวัติทำรายการ");
        }

        // รวมข้อมูลเพื่อให้ง่ายต่อการจัดการที่ Frontend
        // คุณสามารถแยก tab หรือแสดงปนกันก็ได้ที่หน้า UI
        res.json({
            success: true,
            data: {
                purchases: orders,
                topups: topups
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
