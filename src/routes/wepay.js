const express = require("express");
const { wepayRequest, getWepayProductList } = require("../services/wepay");
const { authenticate } = require("../middleware/auth");
const { updateBalance, getBalance } = require("../services/wallet");
const { supabase } = require("../db");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();


/**
 * wePAY Game API - Main Endpoint
 */
router.post("/", async (req, res) => {
    const { action, ...params } = req.body;

    // 1. ดึงรายการเกม (game_list) - ผสมข้อมูลราคาขาย/ส่วนลดจาก DB
    if (action === "game_list") {
        try {
            const result = await getWepayProductList();
            if (result.statusCode !== 200) return res.status(result.statusCode).json(result.data);

            const rawData = result.data.data || {};
            const gameItems = rawData.gtopup || [];

            // ดึงการตั้งค่าราคาจาก DB
            const { data: overrides } = await supabase.from("product_overrides").select("*");
            const overrideMap = {};
            overrides?.forEach(o => {
                overrideMap[`${o.company_id}_${o.original_price}`] = o;
            });

            // ดึงการตั้งค่าภาพและชื่อเกมจาก DB
            const { data: gameSettings } = await supabase.from("game_settings").select("*");
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
                            // ใช้ราคาที่แอดมินตั้งไว้
                            finalPrice = parseFloat(override.selling_price || basePrice);

                            // เช็คส่วนลด (ถ้ามีและอยู่ในช่วงเวลา)
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

            return res.json({ statusCode: 200, data: formatted });
        } catch (error) {
            console.error("❌ Game List Error:", error);
            return res.status(500).json({ statusCode: 500, message: "เกิดข้อผิดพลาดในการโหลดข้อมูลเกม", error: error.message });
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

    // 3. การสั่งซื้อ (purchase) - จำกัดสิทธิ์: ต้องล็อกอิน
    if (action === "purchase") {
        return authenticate(req, res, async () => {
            let currentStep = "initializing";
            try {
                let { productId, reference, payload } = params;
                const { playerId, server } = payload || {};

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
                // ดึงอีเมลผู้ใช้หากใน req.user ไม่มี (เพื่อบันทึกลง orders table)
                let userEmail = req.user.email;
                if (!userEmail) {
                    const { data: uData } = await supabase.from("users").select("email").eq("id", req.user.id).single();
                    userEmail = uData?.email || "unknown@user.com";
                }

                currentStep = "checking_prices_and_settings";
                // 🔍 1. ตรวจสอบการ Override ราคา
                const { data: override } = await supabase
                    .from("product_overrides")
                    .select("*")
                    .eq("company_id", productId)
                    .eq("original_price", basePrice)
                    .maybeSingle();

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

                // 🔍 2. ดึงชื่อเกม
                const { data: gSetting } = await supabase
                    .from("game_settings")
                    .select("custom_name")
                    .eq("company_id", productId)
                    .maybeSingle();

                const finalAmount = expectedPrice;
                const gameDisplayName = gSetting?.custom_name || (payload.name ? payload.name.split('-')[0].trim() : "wePAY Game");

                currentStep = "checking_wallet";
                // 🛡️ 3. ตรวจสอบยอดเงิน
                const currentBalance = await getBalance(req.user.id);
                if (currentBalance < finalAmount) {
                    return res.status(400).json({ success: false, message: `ยอดเงินไม่เพียงพอ (คงเหลือ: ${currentBalance.toFixed(2)} บาท)` });
                }

                currentStep = "deducting_balance";
                // 💰 4. หักเงิน
                await updateBalance(req.user.id, -finalAmount, `จ่าย: ${gameDisplayName} [${productId}]`);

                currentStep = "calling_wepay_api";
                // 🚀 5. ส่งคำสั่งไป wePAY
                // Ensure the callback URL is correct (pointing to this router's callback endpoint)
                const baseUrl = process.env.WEPAY_CALLBACK_URL || "https://www.baimonshop.com/api/wepay-game/callback";
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
                const newOrder = {
                    id: uuidv4(),
                    user_id: req.user.id,
                    user_email: userEmail,
                    game_id: String(productId),
                    game_slug: `wepay-${productId}`,
                    game_name: gameDisplayName,
                    package_id: String(productId),
                    package_name: payload.name || productId,
                    package_price: finalAmount,
                    player_id: String(playerId),
                    server: server || "-",
                    payment_method: "wallet",
                    status: result.statusCode === 200 ? "processing" : "failed",
                    reference: reference,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const { error: dbError } = await supabase.from("orders").insert([newOrder]);
                if (dbError) {
                    console.error("❌ Supabase DB Insert Error:", dbError.message);
                }

                return res.status(result.statusCode).json(result.data);

            } catch (error) {
                console.error(`❌ wePAY Purchase Error at [${currentStep}]:`, error);

                // หากเป็นปัญหาเรื่องยอดเงิน ให้ส่ง 400
                if (error.message.includes("ยอดเงินไม่เพียงพอ")) {
                    return res.status(400).json({
                        success: false,
                        message: error.message,
                        step: currentStep
                    });
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

    res.status(400).json({ message: `Action [${action}] ไม่ถูกต้อง` });
});

/**
 * wePAY Callback Handler - ตาม wepay.txt ข้อ 6 & 7
 * wePAY ส่งข้อมูลแบบ x-www-form-urlencoded
 */
router.post("/callback", express.urlencoded({ extended: true }), async (req, res) => {
    const { dest_ref, transaction_id, status, sms } = req.body;
    console.log(`📩 wePAY Callback Received: [${dest_ref}] Status: ${status}`);

    if (!dest_ref) {
        return res.send("ERROR|MISSING_REF");
    }

    try {
        // ค้นหาออร์เดอร์ในระบบ
        const { data: order, error } = await supabase
            .from("orders")
            .select("*")
            .eq("reference", dest_ref)
            .single();

        if (error || !order) {
            console.error(`❌ Order not found for reference: ${dest_ref}`);
            return res.send(`ERROR|ORDER_NOT_FOUND`);
        }

        // สถานะจาก wePAY: 2 = สำเร็จ, 4 = ล้มเหลว
        if (status == "2") {
            await supabase.from("orders").update({ status: "success" }).eq("reference", dest_ref);
        } else if (status == "4") {
            // ล้มเหลว: เปลี่ยนสถานะและคืนเงินเข้า Wallet
            await supabase.from("orders").update({ status: "failed" }).eq("reference", dest_ref);
            await updateBalance(order.user_id, order.package_price, `คืนเงิน wePAY (รายการล้มเหลว): ${dest_ref}`);
            console.log(`💰 Refunded ${order.package_price} to user ${order.user_id} for failed wePAY order`);
        }

        // ตอบกลับตาม wepay.txt ข้อ 7 เพื่อยืนยันการรับข้อมูล
        res.send(`SUCCEED|ORDER_ID=${dest_ref}`);
    } catch (err) {
        console.error("❌ Callback Process Error:", err.message);
        res.send("ERROR|INTERNAL_SERVER_ERROR");
    }
});

module.exports = router;
