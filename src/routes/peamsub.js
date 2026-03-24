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
    try {
        const result = await getCached("peamsub:app-premium", () => peamsubRequest("/v2/app-premium"), CACHE_TTL);
        if (result.statusCode !== 200) return res.status(result.statusCode).json(result.data);

        const apps = result.data.data || [];
        const { rows: overrides } = await db.execute("SELECT * FROM product_overrides");
        const overrideMap = {};
        
        console.log(`🔍 [Peamsub] Total Overrides in DB: ${overrides?.length || 0}`);
        overrides?.forEach(o => { 
            // Normalize ID and price key
            const priceKey = Number(o.original_price).toFixed(2);
            const key = `${o.company_id.toString().trim()}_${priceKey}`;
            overrideMap[key] = o; 
            console.log(`   - Map Key Saved: ${key} -> ${o.selling_price}`);
        });

        const now = new Date();
        const formatted = apps.map(app => {
            const basePrice = Number(app.price || 0);
            let finalPrice = basePrice;
            let isDiscounted = false;
            
            // Normalize current product key
            const currentPriceKey = basePrice.toFixed(2);
            const appId = app.id.toString().trim();
            const key = `${appId}_${currentPriceKey}`;
            
            const override = overrideMap[key] || overrideMap[`peamsub_${key}`];
            
            if (override) {
                console.log(`🎯 [Peamsub] MATCH FOUND! App ${appId}: ${currentPriceKey} -> ${override.selling_price}`);
                finalPrice = Number(override.selling_price || basePrice);
                
                if (override.discount_price && override.discount_start && override.discount_end) {
                    const start = new Date(override.discount_start);
                    const end = new Date(override.discount_end);
                    if (now >= start && now <= end) {
                        finalPrice = Number(override.discount_price);
                        isDiscounted = true;
                    }
                }
            }

            return {
                ...app,
                price: finalPrice,
                base_price: basePrice,
                override_data: override || null,
                is_discount: isDiscounted
            };
        });

        res.status(200).json({ success: true, data: formatted });
    } catch (err) {
        console.error("❌ Peamsub App List Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
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
    const { type, id, reference, payload, packageName, packagePrice: priceInBody } = req.body;

    try {
        // 1. ตรวจสอบข้อมูลเบื้องต้น
        if (!id || !type) {
            return res.status(400).json({ success: false, message: "ID หรือประเภทสินค้าไม่ถูกต้อง" });
        }

        // 2. ดึงข้อมูลการตั้งค่าระบบและ Override ราคา
        const { rows: sRows } = await db.execute("SELECT * FROM system_settings");
        const sysConfig = (sRows || []).reduce((acc, curr) => { acc[curr.key] = curr.value; return acc; }, {});

        // เราต้องการราคาที่เป็นจริงจาก Peamsub ก่อน (จาก Cache)
        let basePrice = 0;
        if (type === "premium") {
            const appsRes = await getCached("peamsub:app-premium", () => peamsubRequest("/v2/app-premium"), CACHE_TTL);
            const app = (appsRes.data.data || []).find(a => a.id == id);
            if (app) basePrice = parseFloat(app.price);
        } else {
            // กรณีอื่นๆ ใช้ราคาที่ส่งมา (อาจต้องเพิ่มการดึงราคาจริงในอนาคตเพื่อความปลอดภัยสูงสุด)
            basePrice = parseFloat(priceInBody);
        }

        if (isNaN(basePrice)) return res.status(400).json({ success: false, message: "ราคาสินค้าไม่ถูกต้อง" });

        // 3. ตรวจสอบการ Override ราคา
        const { rows: ovRows } = await db.execute({
            sql: "SELECT * FROM product_overrides WHERE company_id = ? AND original_price = ? LIMIT 1",
            args: [id.toString(), basePrice]
        });
        const override = ovRows[0];
        
        let finalPrice = basePrice;
        const now = new Date();

        if (override) {
            finalPrice = parseFloat(override.selling_price || basePrice);
            if (override.discount_price && override.discount_start && override.discount_end) {
                const start = new Date(override.discount_start);
                const end = new Date(override.discount_end);
                if (now >= start && now <= end) {
                    finalPrice = parseFloat(override.discount_price);
                }
            }
        }

        // 4. ตรวจสอบยอดเงิน
        const currentBalance = await getBalance(req.user.id);
        if (currentBalance < finalPrice) {
            return res.status(400).json({
                success: false,
                message: `ยอดเงินไม่เพียงพอ (คงเหลือ: ${currentBalance.toFixed(2)} บาท, ราคาสินค้า: ${finalPrice} บาท)`
            });
        }

        // 5. ทำรายการที่ Peamsub
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
            // หักเงินตามเวลาจริง (finalPrice)
            await updateBalance(req.user.id, -finalPrice, `ซื้อ Peamsub ${type}: ${packageName || id}`);

            // คำนวณแต้มสะสม
            const earnThreshold = parseFloat(sysConfig.point_earn_threshold || 100);
            const earnRate = parseFloat(sysConfig.point_earn_rate || 1);
            const earnedPoints = Math.floor(finalPrice / earnThreshold) * earnRate;
            if (earnedPoints > 0) {
                await db.execute({ sql: "UPDATE users SET points = points + ? WHERE id = ?", args: [earnedPoints, req.user.id] });
            }

            const orderId = uuidv4();
            const productData = result.data?.data?.product_data 
                || result.data?.data?.card 
                || result.data?.data?.code
                || result.data?.data?.credentials
                || result.data?.data || null;

            await db.execute({
                sql: `INSERT INTO orders (id, user_id, user_email, product_id, product_name, amount, player_id, server, status, transaction_id, provider, product_data, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                args: [
                    orderId,
                    req.user.id,
                    req.user.email || "user@example.com",
                    id.toString(),
                    packageName || id.toString(),
                    finalPrice,
                    payload?.playerId || payload?.uid || payload?.number || "-",
                    payload?.server || "-",
                    "success",
                    reference,
                    "peamsub",
                    productData ? JSON.stringify(productData) : null
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
