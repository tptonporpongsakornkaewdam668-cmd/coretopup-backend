const express = require("express");
const axios = require("axios");
const { authenticate } = require("../middleware/auth");
const { updateBalance } = require("../services/wallet");
const { supabase } = require("../db");

const multer = require("multer");
const FormData = require("form-data");

const router = express.Router();

const SLIP2GO_API_URL = (process.env.SLIP2GO_API_URL || "https://connect.slip2go.com").trim().replace(/\/+$/, "");
const SLIP2GO_SECRET_KEY = (process.env.SLIP2GO_SECRET_KEY || "").trim();

/**
 * ฟังก์ชันช่วยสร้าง URL ให้ถูกต้อง (ป้องกัน 404 จากการต่อ String ผิด)
 */
function getSlip2GoUrl(path) {
    // ถ้าใน Env มี /api/verify-slip อยู่แล้ว ให้ตัดออกเพื่อมาต่อใหม่ให้มาตรฐาน
    const base = SLIP2GO_API_URL.replace(/\/api\/verify-slip$/, "");
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
}

// ตั้งค่า Multer สำหรับรับไฟล์รูปภาพ
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.post("/verify-slip-image", authenticate, upload.single("file"), async (req, res) => {
    console.log("-----------------------------------------");
    console.log("🚀 [Payment] Received slip verification request");

    if (!req.file) {
        return res.status(400).json({ success: false, message: "กรุณาอัปโหลดรูปภาพสลิป" });
    }

    try {
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const finalUrl = getSlip2GoUrl("/api/verify-slip/qr-base64/info");

        console.log(`📡 [Payment] Requesting Slip2Go: ${finalUrl}`);

        let response;
        try {
            response = await axios.post(finalUrl, {
                payload: { 
                    imageBase64: base64Image,
                    checkCondition: {
                        checkReceiver: [
                            { 
                                accountNumber: "0912552233",
                                accountNameTH: "พงศกร แก้วดำ",
                                accountNameEN: "Phongsakon Kaeodam",
                                accountType: "01004" // KASIKORN BANK
                            }
                        ],
                        checkDuplicate: true
                    }
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${SLIP2GO_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
        } catch (apiError) {
            console.error("❌ [Payment] Slip2Go API Error:", apiError.response?.data || apiError.message);
            
            // ดึงข้อความแจ้งเตือนจาก Slip2Go มาแสดงให้ผู้ใช้เข้าใจง่าย
            let userMessage = "ไม่สามารถตรวจสอบสลิปได้ (เซิร์ฟเวอร์ขัดข้อง)";
            const apiData = apiError.response?.data;
            
            if (apiError.response?.status === 400) {
                if (apiData?.message?.includes("Duplicated")) userMessage = "สลิปนี้ถูกใช้งานไปแล้ว (สลิปซ้ำ)";
                else if (apiData?.message?.includes("Receiver")) userMessage = "สลิปนี้ไม่ได้โอนเข้าบัญชีของทางร้าน";
                else if (apiData?.message?.includes("Amount")) userMessage = "ยอดเงินในสลิปไม่ตรงกับที่ระบุ";
                else userMessage = apiData?.message || "ข้อมูลสลิปไม่ถูกต้อง";
            }

            return res.status(apiError.response?.status || 500).json({
                success: false,
                message: userMessage,
                error: apiError.message,
                details: apiData
            });
        }

        const slipResult = response.data;
        const code = slipResult.code;
        console.log("✅ [Payment] Slip2Go Response Received Status:", code);

        // ตรวจสอบ Success Code ทั้งหมด (200000 = Found, 200200 = Valid)
        const successCodes = ["200000", "200200"];
        
        if (!successCodes.includes(code)) {
            let errorMsg = "ข้อมูลสลิปไม่ถูกต้อง";
            
            // Mapping ตามตารางสรุปที่ได้รับ
            const errorMap = {
                "200401": "สลิปนี้ไม่ได้โอนเข้าบัญชีของทางร้าน (เลขบัญชีไม่ตรง)",
                "200402": "จำนวนเงินในสลิปไม่ตรงกับยอดที่ระบุ",
                "200403": "วันที่โอนในสลิปไม่ถูกต้อง",
                "200404": "ไม่พบข้อมูลสลิปในระบบธนาคาร",
                "200500": "สลิปเสียหรือสลิปปลอม",
                "200501": "สลิปนี้ถูกใช้งานไปแล้ว (สลิปซ้ำ)",
                "400001": "QR Code ในสลิปไม่ถูกต้อง",
                "400002": "รูปภาพสลิปไม่ถูกต้อง",
                "400005": "รูปแบบรูปภาพ (Base64) ไม่ถูกต้อง",
                "401004": "แพ็กเกจตรวจสอบสลิปหมดอายุ",
                "401005": "โควตาตรวจสอบสลิปของทางร้านหมด",
                "500500": "ระบบธนาคารหรือเซิร์ฟเวอร์ตรวจสอบสลิปขัดข้อง"
            };

            errorMsg = errorMap[code] || slipResult.message || errorMsg;

            console.log(`⚠️ [Payment] Verification failed: ${code} - ${errorMsg}`);
            return res.status(400).json({
                success: false,
                message: errorMsg,
                code: code
            });
        }

        const slipData = slipResult.data;
        if (!slipData) {
            return res.status(400).json({ success: false, message: "ไม่พบข้อมูลสลิปในระบบ" });
        }
        const amount = parseFloat(slipData.amount);
        const transRef = slipData.transRef;

        console.log(`💰 [Payment] Slip Amount: ${amount}, Ref: ${transRef}`);

        // หมายเหตุ: เราไม่ต้องตรวจสอบ receiverAccount เองที่นี่ (endsWith) เพราะเราใช้ checkCondition
        // ส่งไปตรวจที่ Slip2Go แล้ว หากรหัสผ่านคือ 200000/200200 แปลว่า Slip2Go ยืนยันว่าเลขบัญชีผู้รับถูกต้อง
        // การเช็คเองที่นี่จะพังเพราะธนาคารมักจะเซนเซอร์ (Mask) เลขบัญชีใน JSON ข้อมูลสลิป

        console.log("🔍 [Payment] Checking for duplicate transRef in DB...");
        // ตรวจสอบ Duplicate (กันสลิปซ้ำ)
        const { data: existingTopUp, error: dupError } = await supabase
            .from("topups")
            .select("id")
            .eq("trans_ref", transRef)
            .maybeSingle();

        if (dupError) {
            console.error("❌ [Payment] DB Dup Check Error:", dupError);
            throw dupError;
        }

        if (existingTopUp) {
            console.log("⚠️ [Payment] Duplicate slip detected");
            return res.status(400).json({ success: false, message: "สลิปนี้เคยถูกใช้งานไปแล้ว" });
        }

        console.log("📝 [Payment] Inserting topup record into DB...");
        // บันทึกรายการลงตาราง topups
        const { error: insertError } = await supabase
            .from("topups")
            .insert([{
                user_id: req.user.id,
                amount: amount,
                trans_ref: transRef,
                sender_name: slipData.sender?.account?.name || "Unknown",
                sender_bank: slipData.sender?.bank?.name || "Unknown",
                status: "success"
            }]);

        if (insertError) {
            console.error("❌ [Payment] DB Insert Error:", insertError);
            throw insertError;
        }

        console.log("📊 [Payment] Updating user balance...");
        // เติมเงินเข้า Wallet ผู้ใช้จริง
        const newBalance = await updateBalance(req.user.id, amount, `Topup via Image Slip: ${transRef}`);

        console.log("🎉 [Payment] Success! New Balance:", newBalance);
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
        console.error("🔥 [Payment] Verify Slip Image CRASH:", error.response?.data || error.message);
        if (error.stack) console.error(error.stack);
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
        // 1. ส่งข้อมูลไปตรวจสอบที่ Slip2Go API
        const finalUrl = getSlip2GoUrl("/api/verify-slip/qr-code/info");
        console.log("🔍 [Payment] กำลังตรวจสอบ Slip ผ่าน Slip2Go (qr-code)...");

        const response = await axios.post(finalUrl, {
            payload: { 
                qrCode: payload,
                checkCondition: {
                    checkReceiver: [
                        { 
                            accountNumber: "0912552233",
                            accountNameTH: "พงศกร แก้วดำ",
                            accountNameEN: "Phongsakon Kaeodam",
                            accountType: "01004"
                        }
                    ],
                    checkDuplicate: true
                }
            }
        }, {
            headers: {
                'Authorization': `Bearer ${SLIP2GO_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 20000
        });

        const slipResult = response.data;
        const code = slipResult.code;
        console.log("✅ [Payment] Slip2Go QR Response Code:", code);

        // ตรวจสอบความถูกต้องของ Slip (200000 หรือ 200200 = Success)
        const successCodes = ["200000", "200200"];
        if (!successCodes.includes(code)) {
            const errorMap = {
                "200401": "สลิปนี้ไม่ได้โอนเข้าบัญชีของทางร้าน",
                "200501": "สลิปนี้ถูกใช้งานไปแล้ว (สลิปซ้ำ)",
                "200404": "ไม่พบข้อมูลสลิปในเซิร์ฟเวอร์ธนาคาร",
                "400001": "QR Payload ไม่ถูกต้อง"
            };
            return res.status(400).json({ 
                success: false, 
                message: errorMap[code] || slipResult.message || "สลิปไม่ถูกต้องหรือเคยถูกใช้งานไปแล้ว",
                code: code
            });
        }

        const slipData = slipResult.data;
        if (!slipData) {
            return res.status(400).json({ success: false, message: "ไม่พบข้อมูลสลิป" });
        }
        const amount = parseFloat(slipData.amount);
        const transRef = slipData.transRef;

        // เชื่อใจผลลัพธ์จาก Slip2Go (checkCondition ตรวจสอบให้แล้ว)

        // 2. ตรวจสอบในฐานข้อมูลว่ามีการเติมเงินรายการนี้ไปหรือยัง (ป้องกัน Double Top-up)
        const { data: existingTopUp, error: checkError } = await supabase
            .from("topups")
            .select("id")
            .eq("trans_ref", transRef)
            .maybeSingle();

        if (checkError) {
            console.error("❌ [Payment] DB Check Error:", checkError);
            throw checkError;
        }

        if (existingTopUp) {
            return res.status(409).json({ success: false, message: "รายการโอนเงินนี้ถูกใช้ไปแล้ว" });
        }

        // 3. บันทึกประวัติการเติมเงิน
        const { error: insertError } = await supabase
            .from("topups")
            .insert([{
                user_id: req.user.id,
                amount: amount,
                trans_ref: transRef,
                sender_name: slipData.sender?.account?.name || slipData.sender?.name || "Unknown",
                sender_bank: slipData.sender?.bank?.name || slipData.sender?.bank || "Unknown",
                status: "success"
            }]);

        if (insertError) {
            console.error("❌ [Payment] DB Insert Error:", insertError);
            throw insertError;
        }

        // 4. เพิ่มเงินเข้า Wallet ผู้ใช้จริง
        const newBalance = await updateBalance(req.user.id, amount, `Top up via QR: ${transRef}`);

        res.json({
            success: true,
            message: `เติมเงินสำเร็จ! ยอดคงเหลือใหม่: ${newBalance} บาท`,
            data: {
                amount: amount,
                newBalance: newBalance,
                transRef: transRef
            }
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
