const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { authenticate } = require("../middleware/auth");
const { orderLimiter } = require("../middleware/rateLimiter");
const { orderRules } = require("../middleware/validate");
const { supabase } = require("../db");

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
        // 🛡️ 1. ตรวจสอบยอดเงินคงเหลือจาก Wallet Service
        const currentBalance = await getBalance(req.user.id);
        if (currentBalance < packagePrice) {
            return res.status(400).json({
                success: false,
                message: `ยอดเงินไม่เพียงพอ (คงเหลือ: ${currentBalance.toFixed(2)} บาท, ราคาสินค้า: ${packagePrice.toFixed(2)} บาท)`
            });
        }

        // 💰 2. หักเงินผู้ใช้ (ยอดติดลบ)
        await updateBalance(req.user.id, -packagePrice, `ซื้อสินค้า ${gameName}: ${packageName}`);

        // 3. บันทึกคำสั่งซื้อลงฐานข้อมูล
        const newOrder = {
            id: uuidv4(),
            user_id: req.user.id,
            user_email: req.user.email,
            game_slug: gameSlug,
            game_name: gameName,
            package_id: packageId,
            package_name: packageName,
            package_price: Number(packagePrice),
            player_id: playerId,
            server: server || "-",
            payment_method: "wallet",
            status: "pending",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase.from("orders").insert([newOrder]);

        if (insertError) {
            console.error("❌ Supabase Order Insert Error:", insertError);
            // กรณีบันทึก Order ไม่สำเร็จ ต้องพิจารณาเลือกว่าจะคืนเงิน (Refund) ให้ User หรือไม่
            // แต่ในระบบทั่วไป เราควร Logging ไว้เพื่อตรวจสอบ manual
            return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ" });
        }

        console.log(`📦 Order Created [${newOrder.id}]: ${newOrder.game_name} for ${newOrder.user_email}`);

        res.status(201).json({
            success: true,
            message: "สั่งซื้อสำเร็จ ระบบกำลังดำเนินการ",
            data: newOrder,
        });
    } catch (err) {
        console.error("❌ Order Processing Error:", err.message);
        res.status(500).json({ success: false, message: err.message || "เกิดข้อผิดพลาดภายในระบบ" });
    }
});


// ─── GET /api/orders/my ───────────────────────────────────────────────────────
router.get("/my", authenticate, async (req, res) => {
    const { data: myOrders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", req.user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Supabase Get Orders Error:", error);
        return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }

    res.json({ success: true, data: myOrders, count: myOrders.length });
});

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
router.get("/:id", authenticate, async (req, res) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
        return res.status(400).json({ success: false, message: "Order ID ไม่ถูกต้อง" });
    }

    const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", req.params.id)
        .single();

    if (error || !order) {
        return res.status(404).json({ success: false, message: "ไม่พบ Order นี้" });
    }
    if (order.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: "ไม่มีสิทธิ์ดู Order นี้" });
    }

    res.json({ success: true, data: order });
});

module.exports = router;
