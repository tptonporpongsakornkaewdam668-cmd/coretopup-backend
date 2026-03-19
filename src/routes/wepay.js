const express = require("express");
const { wepayRequest, getWepayProductList } = require("../services/wepay");
const { authenticate } = require("../middleware/auth");
const { updateBalance, getBalance } = require("../services/wallet");
const { db } = require("../db");
const { v4: uuidv4 } = require("uuid");
const { getCached, invalidate } = require("../services/cache");

const router = express.Router();
const WEPAY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * wePAY Game API - Main Endpoint
 */
router.post("/", async (req, res) => {
    const { action, ...params } = req.body;

    // 1. game_list - cached 5 min
    if (action === "game_list") {
        try {
            const formatted = await getCached("wepay:game_list", async () => {
                const result = await getWepayProductList();
                if (result.statusCode !== 200) throw new Error(result.data?.message || "wePAY error");

                const rawData = result.data.data || {};
                const gameItems = rawData.gtopup || [];

                const { rows: overrides } = await db.execute("SELECT * FROM product_overrides");
                const overrideMap = {};
                overrides?.forEach(o => { overrideMap[`${o.company_id}_${o.original_price}`] = o; });

                const { rows: gameSettings } = await db.execute("SELECT * FROM game_settings");
                const settingsMap = {};
                gameSettings?.forEach(s => { settingsMap[s.company_id] = s; });

                const formatted = [];
                const now = new Date();

                gameItems.forEach(game => {
                    const setting = settingsMap[game.company_id];
                    const displayName = setting?.custom_name || game.company_name;
                    const displayImg = setting?.custom_image_url || game.img || null;

                    if (game.denomination && Array.isArray(game.denomination)) {
                        game.denomination.forEach(denom => {
                            const basePrice = parseFloat(denom.price || 0);
                            const override = overrideMap[`${game.company_id}_${basePrice}`];

                            let finalPrice = basePrice;
                            let isDiscounted = false;

                            if (override) {
                                finalPrice = parseFloat(override.selling_price || basePrice);
                                if (override.discount_price && override.discount_start && override.discount_end) {
                                    const start = new Date(override.discount_start);
                                    const end = new Date(override.discount_end);
                                    if (now >= start && now <= end) {
                                        finalPrice = parseFloat(override.discount_price);
                                        isDiscounted = true;
                                    }
                                }
                            }

                            const cleanDesc = denom.description
                                ? denom.description.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()
                                : '';

                            formatted.push({
                                id: game.company_id,
                                original_id: game.company_id,
                                name: `${displayName} - ${cleanDesc || (denom.price + ' บาท')}`,
                                price: finalPrice,
                                base_price: basePrice,
                                cost: override?.cost_price || null,
                                category: displayName,
                                img: displayImg || null,
                                des: cleanDesc,
                                type: 'gtopup',
                                is_discount: isDiscounted,
                                override_data: override || null,
                                setting_data: setting || null
                            });
                        });
                    }
                });
                return formatted;
            }, WEPAY_CACHE_TTL);

            return res.json({ statusCode: 200, data: formatted });
        } catch (error) {
            console.error("❌ Game List Error:", error);
            return res.status(500).json({ statusCode: 500, message: "เกิดข้อผิดพลาดในการโหลดข้อมูลเกม", error: error.message });
        }
    }

    // 1.5 cashcard_list - cached 5 min
    if (action === "cashcard_list") {
        try {
            const formatted = await getCached("wepay:cashcard_list", async () => {
                const result = await getWepayProductList();
                if (result.statusCode !== 200) throw new Error(result.data?.message || "wePAY error");

                const rawData = result.data.data || {};
                const cashcardItems = rawData.cashcard || [];

                const { rows: overrides } = await db.execute("SELECT * FROM product_overrides");
                const overrideMap = {};
                overrides?.forEach(o => { overrideMap[`${o.company_id}_${o.original_price}`] = o; });

                const { rows: gameSettings } = await db.execute("SELECT * FROM game_settings");
                const settingsMap = {};
                gameSettings?.forEach(s => { settingsMap[s.company_id] = s; });

                const formatted = [];
                const now = new Date();

                cashcardItems.forEach(card => {
                    const setting = settingsMap[card.company_id];
                    const displayName = setting?.custom_name || card.company_name;
                    const displayImg = setting?.custom_image_url || card.img || null;

                    if (card.denomination && Array.isArray(card.denomination)) {
                        card.denomination.forEach(denom => {
                            const basePrice = parseFloat(denom.price || 0);
                            const override = overrideMap[`${card.company_id}_${basePrice}`];

                            let finalPrice = basePrice;
                            let isDiscounted = false;
                            if (override) {
                                finalPrice = parseFloat(override.selling_price || basePrice);
                                if (override.discount_price && override.discount_start && override.discount_end) {
                                    const start = new Date(override.discount_start);
                                    const end = new Date(override.discount_end);
                                    if (now >= start && now <= end) { finalPrice = parseFloat(override.discount_price); isDiscounted = true; }
                                }
                            }

                            const cleanDesc = denom.description
                                ? denom.description.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()
                                : `${basePrice} บาท`;

                            formatted.push({
                                id: card.company_id,
                                original_id: card.company_id,
                                name: `${displayName} ${basePrice} บาท`,
                                price: finalPrice,
                                base_price: basePrice,
                                category: displayName,
                                description: cleanDesc,
                                img: displayImg || null,
                                type: 'cashcard',
                                is_discount: isDiscounted,
                            });
                        });
                    }
                });
                return formatted;
            }, WEPAY_CACHE_TTL);

            return res.json({ statusCode: 200, data: formatted });
        } catch (error) {
            console.error("❌ CashCard List Error:", error);
            return res.status(500).json({ statusCode: 500, message: "เกิดข้อผิดพลาดในการโหลดบัตรเงินสด", error: error.message });
        }
    }

    // 2. ตรวจสอบสถานะรายการ (check_order) - ตาม wepay.txt ข้อ 9
    if (action === "check_order") {
        const { transaction_id } = params;
        if (!transaction_id) return res.status(400).json({ message: "Missing transaction_id" });

        const result = await wepayRequest({
            type: "get_output",
            transaction_id: String(transaction_id)
        });
        return res.status(result.statusCode).json(result.data);
    }

    // 2.5 ตรวจสอบโค้ดส่วนลด (verify_discount)
    if (action === "verify_discount") {
        const { code, amount } = params;
        if (!code) return res.status(400).json({ success: false, message: "Missing code" });

        try {
            const result = await db.execute({
                sql: "SELECT * FROM discount_codes WHERE code = ? AND is_active = 1 LIMIT 1",
                args: [code.toUpperCase()]
            });
            const discount = result.rows[0];

            if (!discount) return res.status(404).json({ success: false, message: "ไม่พบโค้ดส่วนลดนี้ หรือโค้ดหมดอายุแล้ว" });

            const now = new Date();
            if (discount.end_date && now > new Date(discount.end_date)) {
                return res.status(400).json({ success: false, message: "โค้ดส่วนลดนี้หมดอายุแล้ว" });
            }

            if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
                return res.status(400).json({ success: false, message: "โค้ดส่วนลดนี้ถูกใช้ครบจำนวนแล้ว" });
            }

            if (amount < discount.min_order_amount) {
                return res.status(400).json({ success: false, message: `ยอดสั่งซื้อขั้นต่ำต้องถึง ${discount.min_order_amount} บาท` });
            }

            let discountAmount = 0;
            if (discount.type === 'percent') {
                discountAmount = (amount * discount.value) / 100;
                if (discount.max_discount && discountAmount > discount.max_discount) {
                    discountAmount = discount.max_discount;
                }
            } else {
                discountAmount = discount.value;
            }

            return res.json({ success: true, data: discount, discountAmount });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // 3. การสั่งซื้อ (purchase) - จำกัดสิทธิ์: ต้องล็อกอิน
    if (action === "purchase") {
        return authenticate(req, res, async () => {
            let currentStep = "initializing";
            try {
                let { productId, reference, payload } = params;
                const { playerId, server, promoCode, usePoints } = payload || {};

                // Fallback: ดึงข้อมูล productId จากตำแหน่งที่มีโอกาสเป็นไปได้มากที่สุด
                productId = productId || payload?.productId || payload?.company_id || payload?.id;

                if (!reference) {
                    reference = `WP-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
                }

                currentStep = "validating_payload";
                const basePrice = parseFloat(payload?.base_price || payload?.price || 0);

                if (!productId || !basePrice || !playerId) {
                    console.error("❌ Invalid Purchase Payload:", { productId, basePrice, playerId });
                    return res.status(400).json({ success: false, message: "ข้อมูลการสั่งซื้อไม่ครบถ้วน (กรุณากรอก Player ID และเลือกราคา)" });
                }

                currentStep = "fetching_user_info";
                const { rows: uRows } = await db.execute({
                    sql: "SELECT email, points FROM users WHERE id = ? LIMIT 1",
                    args: [req.user.id]
                });
                const userData = uRows[0];
                const userEmail = userData?.email || "unknown@user.com";
                const userPoints = userData?.points || 0;

                currentStep = "checking_prices_and_settings";
                // 🔍 0. ดึงการตั้งค่าระบบ
                const { rows: sRows } = await db.execute("SELECT * FROM system_settings");
                const sysConfig = (sRows || []).reduce((acc, curr) => {
                    acc[curr.key] = curr.value;
                    return acc;
                }, {});

                // 🔍 1. ตรวจสอบการ Override ราคา
                const { rows: ovRows } = await db.execute({
                    sql: "SELECT * FROM product_overrides WHERE company_id = ? AND original_price = ? LIMIT 1",
                    args: [productId, basePrice]
                });
                const override = ovRows[0];

                let expectedPrice = basePrice;
                const now = new Date();

                if (override) {
                    expectedPrice = parseFloat(override.selling_price || basePrice);
                    if (override.discount_price && override.discount_start && override.discount_end) {
                        const start = new Date(override.discount_start);
                        const end = new Date(override.discount_end);
                        if (now >= start && now <= end) {
                            expectedPrice = parseFloat(override.discount_price);
                        }
                    }
                }

                // 🔍 1.5 ตรวจสอบ Promo Code (ถ้ามีการส่งมา)
                let discountAmount = 0;
                let appliedPromo = null;

                if (promoCode) {
                    const { rows: prRows } = await db.execute({
                        sql: "SELECT * FROM discount_codes WHERE code = ? AND is_active = 1 LIMIT 1",
                        args: [promoCode.toUpperCase()]
                    });
                    const discount = prRows[0];

                    if (discount) {
                        const isExpired = discount.end_date && now > new Date(discount.end_date);
                        const isLimitReached = discount.usage_limit && discount.usage_count >= discount.usage_limit;
                        const isMinMet = expectedPrice >= discount.min_order_amount;

                        if (!isExpired && !isLimitReached && isMinMet) {
                            if (discount.type === 'percent') {
                                discountAmount = (expectedPrice * discount.value) / 100;
                                if (discount.max_discount && discountAmount > discount.max_discount) {
                                    discountAmount = discount.max_discount;
                                }
                            } else {
                                discountAmount = discount.value;
                            }
                            appliedPromo = discount;
                        }
                    }
                }
                
                // 🔍 1.6 ตรวจสอบการใช้แต้ม (Redeem Points)
                let pointDiscount = 0;
                let usedPointsCount = 0;

                if (usePoints && userPoints > 0) {
                    const redeemRate = parseFloat(sysConfig.point_redeem_rate || 0.1);
                    pointDiscount = userPoints * redeemRate;
                    usedPointsCount = userPoints;
                }

                const finalAmount = Math.max(0, expectedPrice - discountAmount - pointDiscount);
                
                // 🔍 2. ดึงชื่อเกมและการตั้งค่า
                const { rows: gsRows } = await db.execute({
                    sql: "SELECT * FROM game_settings WHERE company_id = ? LIMIT 1",
                    args: [productId]
                });
                const gSetting = gsRows[0];
                const gameDisplayName = gSetting?.custom_name || (payload.name ? payload.name.split('-')[0].trim() : "wePAY Game");

                const earnThreshold = parseFloat(sysConfig.point_earn_threshold || 100);
                const earnRate = parseFloat(sysConfig.point_earn_rate || 1);
                const earnedPoints = Math.floor(finalAmount / earnThreshold) * earnRate;

                currentStep = "checking_wallet";
                // 🛡️ 3. ตรวจสอบยอดเงิน
                const currentBalance = await getBalance(req.user.id);
                if (currentBalance < finalAmount) {
                    return res.status(400).json({ success: false, message: `ยอดเงินไม่เพียงพอ (คงเหลือ: ${currentBalance.toFixed(2)} บาท)` });
                }

                currentStep = "deducting_balance_and_points";
                // 💰 4. หักเงินและยอดแต้ม
                await updateBalance(req.user.id, -finalAmount, `จ่าย: ${gameDisplayName} [${productId}]${usePoints ? ' (ใช้แต้ม)' : ''}`);
                
                if (usedPointsCount > 0) {
                    await db.execute({
                        sql: "UPDATE users SET points = 0 WHERE id = ?",
                        args: [req.user.id]
                    });
                }

                currentStep = "calling_wepay_api";
                // 🚀 5. ส่งคำสั่งไป wePAY
                const baseUrl = process.env.WEPAY_CALLBACK_URL || "https://api.coinzonetopup.shop/api/wepay-game/callback";
                const wepayBody = {
                    type: payload.type || "gtopup",
                    pay_to_company: productId,
                    pay_to_amount: String(basePrice),
                    pay_to_ref1: String(playerId),
                    dest_ref: reference,
                    resp_url: baseUrl.includes("callback") ? baseUrl : `${baseUrl}/callback`
                };

                if (server && server !== "-") {
                    wepayBody.pay_to_ref2 = String(server);
                }

                const result = await wepayRequest(wepayBody);

                currentStep = "saving_order_to_db";
                // 📝 6. บันทึกประวัติการสั่งซื้อ
                const orderId = uuidv4();
                await db.execute({
                    sql: `INSERT INTO orders (id, user_id, product_id, product_name, player_id, server, amount, status, transaction_id, provider, created_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    args: [
                        orderId, 
                        req.user.id, 
                        String(productId), 
                        gameDisplayName, 
                        String(playerId), 
                        server || "-", 
                        finalAmount, 
                        result.statusCode === 200 ? "processing" : "failed",
                        reference,
                        "wepay"
                    ]
                });

                // สรุปการใช้โค้ดส่วนลดใน DB
                if (appliedPromo) {
                    await db.execute({
                        sql: "UPDATE discount_codes SET usage_count = usage_count + 1 WHERE id = ?",
                        args: [appliedPromo.id]
                    });
                }

                return res.status(result.statusCode).json(result.data);

            } catch (error) {
                console.error(`❌ wePAY Purchase Error at [${currentStep}]:`, error);

                if (error.message.includes("ยอดเงินไม่เพียงพอ")) {
                    return res.status(400).json({ success: false, message: error.message, step: currentStep });
                }

                return res.status(500).json({
                    success: false,
                    message: `เกิดข้อผิดพลาดที่ขั้นตอน ${currentStep}`,
                    details: error.message,
                    step: currentStep
                });
            }
        });
    }

    // 4. ดึงข้อมูลการตั้งค่าระบบ (แต้ม/ข้อตกลง)
    if (action === "get-settings") {
        try {
            const { rows: settings } = await db.execute("SELECT * FROM system_settings");
            const config = settings.reduce((acc, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});
            return res.json({ success: true, data: config });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    res.status(400).json({ message: `Action [${action}] ไม่ถูกต้อง` });
});

/**
 * wePAY Callback Handler
 */
router.post("/callback", express.urlencoded({ extended: true }), async (req, res) => {
    const { dest_ref, transaction_id, status } = req.body;
    console.log(`📩 wePAY Callback Received: [${dest_ref}] Status: ${status}`);

    if (!dest_ref) return res.send("ERROR|MISSING_REF");

    try {
        const { rows: oRows } = await db.execute({
            sql: "SELECT * FROM orders WHERE transaction_id = ? LIMIT 1",
            args: [dest_ref]
        });
        const order = oRows[0];

        if (!order) {
            console.error(`❌ Order not found for reference: ${dest_ref}`);
            return res.send(`ERROR|ORDER_NOT_FOUND`);
        }

        if (status == "2") {
            await db.execute({ sql: "UPDATE orders SET status = 'success' WHERE transaction_id = ?", args: [dest_ref] });
            
            // 🎁 มอบแต้มให้ผู้ใช้ (รางวัลการซื้อ)
            const earnThreshold = 100; // ปกติ 100 บาทได้ 1 แต้ม
            const earnedPoints = Math.floor(Number(order.amount) / earnThreshold);
            if (earnedPoints > 0) {
                await db.execute({ sql: "UPDATE users SET points = points + ? WHERE id = ?", args: [earnedPoints, order.user_id] });
                console.log(`🎁 Awarded ${earnedPoints} points to user ${order.user_id}`);
            }
        } else if (status == "4") {
            await db.execute({ sql: "UPDATE orders SET status = 'failed' WHERE transaction_id = ?", args: [dest_ref] });
            await updateBalance(order.user_id, Number(order.amount), `คืนเงิน wePAY (รายการล้มเหลว): ${dest_ref}`);
            console.log(`💰 Refunded ${order.amount} to user ${order.user_id} for failed order`);
        }

        res.send(`SUCCEED|ORDER_ID=${dest_ref}`);
    } catch (err) {
        console.error("❌ Callback Process Error:", err.message);
        res.send("ERROR|INTERNAL_SERVER_ERROR");
    }
});

module.exports = router;
