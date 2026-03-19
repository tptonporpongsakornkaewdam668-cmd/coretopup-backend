const express = require("express");
const { peamsubRequest } = require("../services/peamsub");
const { authenticate } = require("../middleware/auth");
const { updateBalance, getBalance } = require("../services/wallet");
const { db } = require("../db");
const { v4: uuidv4 } = require("uuid");
const { getCached } = require("../services/cache");

const router = express.Router();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// 1. ดึงข้อมูล User Peamsub
router.get("/user/inquiry", authenticate, async (req, res) => {
    const result = await peamsubRequest("/v2/user/inquiry");
    res.status(result.statusCode).json(result.data);
});

// 2. ดึงรายการแอพพรีเมียม - cached
router.get("/app-premium", async (req, res) => {
    const result = await getCached("peamsub:app-premium", () => peamsubRequest("/v2/app-premium"), CACHE_TTL);
    res.status(result.statusCode).json(result.data);
});

// 3. ดึงรายการเติมเกม - cached
router.get("/game", async (req, res) => {
    const result = await getCached("peamsub:game", () => peamsubRequest("/v2/game"), CACHE_TTL);
    res.status(result.statusCode).json(result.data);
});

// 4. ดึงรายการบัตรเงินสด - cached
router.get("/cashcard", async (req, res) => {
    const result = await getCached("peamsub:cashcard", () => peamsubRequest("/v2/cashcard"), CACHE_TTL);
    res.status(result.statusCode).json(result.data);
});

// 5. ดึงรายการเติมเงิน/เน็ตมือถือ - cached
router.get("/mobile", async (req, res) => {
    const result = await getCached("peamsub:mobile", () => peamsubRequest("/v2/mobile"), CACHE_TTL);
    res.status(result.statusCode).json(result.data);
});

/**
 * การซื้อสินค้า (POST) - ต้องล็อกอินและตรวจสอบยอดเงินใน Turso
 */
router.post("/purchase", authenticate, async (req, res) => {
    const { type, id, reference, payload, packageName, packagePrice } = req.body;

    if (packagePrice === undefined || packagePrice === null || isNaN(packagePrice)) {
        return res.status(400).json({ success: false, message: "ราคาไม่ถูกต้อง" });
    }

    try {
        const currentBalance = await getBalance(req.user.id);
        if (currentBalance < packagePrice) {
            return res.status(400).json({
                success: false,
                message: `ยอดเงินไม่เพียงพอ (คงเหลือ: ${currentBalance.toFixed(2)} บาท, ราคาสินค้า: ${packagePrice} บาท)`
            });
        }

        let endpoint = "";
        if (type === "premium") endpoint = "/v2/app-premium";
        else if (type === "game") endpoint = "/v2/game";
        else if (type === "mobile") endpoint = "/v2/mobile";
        else if (type === "cashcard") endpoint = "/v2/cashcard";
        else if (type === "preorder") endpoint = "/v2/preorder";
        else return res.status(400).json({ success: false, message: "ประเภทสินค้าไม่ถูกต้อง" });

        const result = await peamsubRequest(endpoint, "POST", { id, reference, ...(payload || {}) });
        const peamsubSuccess = result.data?.statusCode === 200;

        if (peamsubSuccess) {
            await updateBalance(req.user.id, -packagePrice, `ซื้อสินค้า Peamsub ${type}: ${packageName || id}`);

            const orderId = uuidv4();
            await db.execute({
                sql: `INSERT INTO orders (id, user_id, user_email, product_id, product_name, amount, player_id, server, status, transaction_id, provider, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                args: [
                    orderId,
                    req.user.id,
                    req.user.email || "user@example.com",
                    id.toString(),
                    packageName || id.toString(),
                    Number(packagePrice),
                    payload?.playerId || payload?.uid || payload?.number || "-",
                    payload?.server || "-",
                    "success",
                    reference,
                    "peamsub"
                ]
            });

            return res.status(200).json({
                success: true,
                message: "สั่งซื้อสำเร็จ",
                data: result.data
            });
        } else {
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
