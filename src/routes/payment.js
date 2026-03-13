const express = require("express");
const axios = require("axios");
const { authenticate } = require("../middleware/auth");
const { updateBalance } = require("../services/wallet");
const { supabase } = require("../db");

const multer = require("multer");
const FormData = require("form-data");

const router = express.Router();

const SLIP2GO_API_URL = process.env.SLIP2GO_API_URL || "https://connect.slip2go.com";
const SLIP2GO_SECRET_KEY = process.env.SLIP2GO_SECRET_KEY;

// ตั้งค่า Multer สำหรับรับไฟล์รูปภาพ (เก็บใน Memory ชั่วคราวเพื่อส่งต่อ)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // จำกัด 5MB
});

/**
 * Endpoint: ตรวจสอบ Slip ผ่าน "รูปภาพ" (Image Upload)
 * เลียนแบบระบบ Baimonshop เพื่อความสะดวกของผู้ใช้
 */
router.post("/verify-slip-image", authenticate, upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "กรุณาอัปโหลดรูปภาพสลิป" });
    }

    try {
        console.log(`🔍 [Payment] กำลังตรวจสอบสลิปจากรูปภาพ: ${req.file.originalname}`);

        // เตรียม Multipart Form Data เพื่อส่งให้ Slip2Go
        const form = new FormData();
        form.append("file", req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        // ส่งไป Slip2Go API
        const response = await axios.post(`${SLIP2GO_API_URL}/api/verify-slip/qr-image/info`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${SLIP2GO_SECRET_KEY}`
            }
        });

        const slipResult = response.data;

        // ตรวจสอบ Code จาก Slip2Go (200000 = พบสลิป)
        if (slipResult.code !== "200000" || !slipResult.data) {
            return res.status(400).json({
                success: false,
                message: slipResult.message || "ไม่พบข้อมูลสลิปที่ถูกต้อง",
                code: slipResult.code
            });
        }

        const slipData = slipResult.data;
        const amount = parseFloat(slipData.amount);
        const transRef = slipData.transRef;

        // ตรวจสอบ Duplicate (กันสลิปซ้ำ)
        const { data: existingTopUp } = await supabase
            .from("topups")
            .select("id")
            .eq("trans_ref", transRef)
            .single();

        if (existingTopUp) {
            return res.status(400).json({ success: false, message: "สลิปนี้เคยถูกใช้งานไปแล้ว" });
        }

        // บันทึกรายการลงตาราง topups
        const { error: insertError } = await supabase
            .from("topups")
            .insert([{
                user_id: req.user.id,
                amount: amount,
                trans_ref: transRef,
                sender_name: slipData.sender?.account?.name,
                sender_bank: slipData.sender?.bank?.name,
                status: "success"
            }]);

        if (insertError) throw insertError;

        // เติมเงินเข้า Wallet ผู้ใช้จริง
        const newBalance = await updateBalance(req.user.id, amount, `Topup via Image Slip: ${transRef}`);

        res.json({
            success: true,
            message: `เติมเงินสำเร็จเรียบร้อยแล้ว จำนวน ${amount} บาท`,
            data: {
                amount,
                newBalance,
                transRef
            }
        });

    } catch (error) {
        console.error("❌ [Payment] Verify Slip Image Error:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการประมวลผลสลิป",
            error: error.message
        });
    }
});

/**
 * Endpoint: ตรวจสอบ Slip (QR Payload)
 */
router.post("/verify-slip", authenticate, async (req, res) => {

    const { payload } = req.body; // payload คือข้อมูลที่ได้จากการสแกน QR ภายใน App (โดยใช้ Lib ฝั่ง Client)

    if (!payload) {
        return res.status(400).json({ success: false, message: "กรุณาระบุข้อมูล Slip (Payload)" });
    }

    try {
        // 1. ส่งข้อมูลไปตรวจสอบที่ Slip2Go API (ศูนย์รวมยืนยันยอดเงินจริงจากธนาคาร)
        console.log("🔍 [Payment] กำลังตรวจสอบ Slip ผ่าน Slip2Go...");

        const response = await axios.post(`${SLIP2GO_API_URL}/api/v1/check-slip`, {
            payload: payload
        }, {
            headers: {
                'x-authorization': SLIP2GO_SECRET_KEY,
                'Content-Type': 'application/json'
            }
        });

        const slipResult = response.data;

        // ตรวจสอบความถูกต้องของ Slip (สถานะ Success และ ข้อมูลจากธนาคาร)
        if (!slipResult.success || !slipResult.data) {
            return res.status(400).json({ success: false, message: "Slip ไม่ถูกต้องหรือถูกใช้งานไปแล้ว" });
        }

        const slipData = slipResult.data;
        const amount = parseFloat(slipData.amount);
        const transRef = slipData.transRef; // เลขอ้างอิงธนาคาร (กันโอนซ้ำ)

        // 2. ตรวจสอบในฐานข้อมูลว่ามีการเติมเงินรายการนี้ไปหรือยัง (ป้องกัน Double Top-up)
        const { data: existingTopUp, error: checkError } = await supabase
            .from("topups")
            .select("id")
            .eq("trans_ref", transRef)
            .single();

        if (existingTopUp) {
            return res.status(409).json({ success: false, message: "รายการโอนเงินนี้ถูกใช้ไปแล้ว" });
        }

        // 3. บันทึกประวัติการเติมเงิน (Pending -> Success)
        const { data: topupRecord, error: insertError } = await supabase
            .from("topups")
            .insert([{
                user_id: req.user.id,
                amount: amount,
                trans_ref: transRef,
                sender_name: slipData.sender?.name,
                sender_bank: slipData.sender?.bank,
                status: "success",
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (insertError) throw insertError;

        // 4. เพิ่มเงินเข้า Wallet ผู้ใช้จริง
        const newBalance = await updateBalance(req.user.id, amount, `Top up via Slip: ${transRef}`);

        res.json({
            success: true,
            message: `เติมเงินสำเร็จ! ยอดคงเหลือใหม่: ${newBalance} บาท`,
            amount: amount,
            balance: newBalance
        });

    } catch (error) {
        console.error("❌ [Payment] Slip Verification Error:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการตรวจสอบ Slip",
            error: error.response?.data?.message || error.message
        });
    }
});

module.exports = router;
