const express = require("express");
const { peamsubRequest } = require("../services/peamsub");
const { authenticate } = require("../middleware/auth");
const { updateBalance, getBalance } = require("../services/wallet");
const { supabase } = require("../db");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

/**
 * ทุกครั้งที่ Frontend ร้องขอสินค้า จะผ่านหน้านี้ ทำให้ API Key ของ Peamsub ปลอดภัยไม่รั่วไหล
 */

// 1. ดึงข้อมูล User Peamsub (ดูเงินคงเหลือในระบบ Peamsub)
router.get("/user/inquiry", authenticate, async (req, res) => {
    const result = await peamsubRequest("/v2/user/inquiry");
    res.status(result.statusCode).json(result.data);
});

// 2. ดึงรายการแอพพรีเมียม (Premium Apps)
router.get("/app-premium", async (req, res) => {
    const result = await peamsubRequest("/v2/app-premium");
    res.status(result.statusCode).json(result.data);
});

// 3. ดึงรายการเติมเกม (Game Products - Peamsub Version)
router.get("/game", async (req, res) => {
    const result = await peamsubRequest("/v2/game");
    res.status(result.statusCode).json(result.data);
});

// 4. ดึงรายการบัตรเงินสด (Cash Cards)
router.get("/cashcard", async (req, res) => {
    const result = await peamsubRequest("/v2/cashcard");
    res.status(result.statusCode).json(result.data);
});

// 5. ดึงรายการเติมเงิน/เน็ตมือถือ (Mobile Products)
router.get("/mobile", async (req, res) => {
    const result = await peamsubRequest("/v2/mobile");
    res.status(result.statusCode).json(result.data);
});

/**
 * การซื้อสินค้า (POST) - ต้องล็อกอินและมีการตรวจสอบยอดคงตัวผู้ใช้ใน Supabase ก่อนเสมอ
 */
router.post("/purchase", authenticate, async (req, res) => {
    const { type, id, reference, payload, packageName, packagePrice } = req.body;

    // 1. ตรวจสอบข้อมูลเบื้องต้น
    if (packagePrice === undefined || packagePrice === null || isNaN(packagePrice)) {
        return res.status(400).json({ success: false, message: "ราคาไม่ถูกต้อง" });
    }

    try {
        // 2. ตรวจสอบยอดเงินใน Wallet
        const currentBalance = await getBalance(req.user.id);
        if (currentBalance < packagePrice) {
            return res.status(400).json({
                success: false,
                message: `ยอดเงินไม่เพียงพอ (คงเหลือ: ${currentBalance.toFixed(2)} บาท, ราคาสินค้า: ${packagePrice} บาท)`
            });
        }

        // กำหนด endpoint ตามประเภทสินค้า
        let endpoint = "";
        if (type === "premium") endpoint = "/v2/app-premium";
        else if (type === "game") endpoint = "/v2/game";
        else if (type === "mobile") endpoint = "/v2/mobile";
        else if (type === "cashcard") endpoint = "/v2/cashcard";
        else if (type === "preorder") endpoint = "/v2/preorder";
        else return res.status(400).json({ success: false, message: "ประเภทสินค้าไม่ถูกต้อง" });

        // 3. ส่งคำสั่งซื้อไป Peamsub
        const result = await peamsubRequest(endpoint, "POST", { id, reference, ...(payload || {}) });

        console.log(`📦 [Peamsub Purchase] Result statusCode: ${result.statusCode}, data:`, JSON.stringify(result.data));

        // Peamsub ส่งผลใน body: { statusCode: 200, data: "..." } หรือ { statusCode: 400, error: "...", message: "..." }
        const peamsubSuccess = result.data?.statusCode === 200;

        if (peamsubSuccess) {
            // 4. หักเงินผู้ใช้
            await updateBalance(req.user.id, -packagePrice, `ซื้อสินค้า Peamsub ${type}: ${packageName || id}`);

            // 5. บันทึกประวัติลง Supabase Table: orders
            const newOrder = {
                id: uuidv4(),
                user_id: req.user.id,
                user_email: req.user.email || "user@example.com",
                game_id: id.toString(),
                game_slug: `peamsub-${type}-${id}`,
                game_name: type === "premium" ? "Premium App" : type === "cashcard" ? "Cash Card" : "Peamsub Service",
                package_id: id.toString(),
                package_name: packageName || `Product ID: ${id}`,
                package_price: Number(packagePrice),
                player_id: payload?.playerId || payload?.uid || payload?.number || "-",
                server: payload?.server || "-",
                payment_method: "wallet",
                status: "success",
                reference: reference,
                product_data: JSON.stringify(result.data?.data ?? null), // ข้อมูลสินค้า/รหัสจาก Peamsub
                promo_code: null,
                discount_amount: 0,
                earned_points: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            let { error: insertError } = await supabase.from("orders").insert([newOrder]);

            // Fallback: ถ้า column product_data ยังไม่ได้เพิ่มใน Supabase → ลอง insert ใหม่โดยไม่มี product_data
            if (insertError && insertError.message?.includes("product_data")) {
                console.warn("⚠️ product_data column not found, retrying without it. Please add the column to Supabase.");
                const { product_data, ...orderWithoutProductData } = newOrder;
                const retry = await supabase.from("orders").insert([orderWithoutProductData]);
                insertError = retry.error;
            }

            if (insertError) {
                console.error("❌ Peamsub History Insert Error:", insertError.message, insertError);
                return res.status(500).json({ 
                    success: false, 
                    message: "บันทึกประวัติล้มเหลว: " + insertError.message,
                    error: insertError 
                });
            } else {
                console.log(`✅ Peamsub order recorded in history: ${newOrder.id} (Ref: ${reference})`);
            }

            return res.status(200).json({
                success: true,
                message: "สั่งซื้อสำเร็จ",
                data: result.data
            });
        } else {
            // กรณี Peamsub ตอบกลับ Error (เช่น ของหมด)
            return res.status(result.statusCode).json({
                success: false,
                message: result.data?.message || "เกิดข้อผิดพลาดจากผู้ให้บริการ (Peamsub)",
                error: result.data
            });
        }
    } catch (err) {
        console.error("❌ Peamsub Purchase Error:", err.message);
        res.status(500).json({ success: false, message: err.message || "เกิดข้อผิดพลาดภายในระบบ" });
    }
});

module.exports = router;
