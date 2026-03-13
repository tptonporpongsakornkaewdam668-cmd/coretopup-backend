const express = require("express");
const { peamsubRequest } = require("../services/peamsub");
const { authenticate } = require("../middleware/auth");

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
    const { type, id, reference, payload } = req.body;

    // กำหนด endpoint ตามประเภทสินค้า
    let endpoint = "";
    if (type === "premium") endpoint = "/v2/app-premium";
    else if (type === "game") endpoint = "/v2/game";
    else if (type === "mobile") endpoint = "/v2/mobile";
    else if (type === "cashcard") endpoint = "/v2/cashcard";
    else return res.status(400).json({ success: false, message: "ประเภทสินค้าไม่ถูกต้อง" });

    // 📋 ขั้นตอนสำคัญ:
    // 1. ตรวจสอบยอดเงินใน Wallet ของผู้ใช้ใน Supabase (โปรเจกต์นี้)
    // 2. ถ้าพอ ให้หักยอดเงินใน Wallet ของผู้ใช้
    // 3. ส่งคำสั่งซื้อไป Peamsub
    // 4. บันทึกประวัติลง Supabase Table: purchases หรือ history

    const result = await peamsubRequest(endpoint, "POST", { id, reference, ...payload });
    res.status(result.statusCode).json(result.data);
});

module.exports = router;
