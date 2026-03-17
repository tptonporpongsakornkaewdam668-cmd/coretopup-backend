const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateAdmin } = require("../middleware/adminAuth");
const { adminLoginRules } = require("../middleware/validate");
const { adminLimiter } = require("../middleware/rateLimiter");
const { supabase } = require("../db");
const multer = require("multer");

const router = express.Router();

// Multer storage for slider images
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ─── POST /api/admin/login ────────────────────────────────────────────────────
router.post("/login", adminLimiter, adminLoginRules, async (req, res) => {
    const { email, password } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (email !== adminEmail) {
        await bcrypt.compare("dummy", "$2a$12$dummyhashforsecuritypurposes000000000000000000000000000");
        return res.status(401).json({ success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const isMatch = await bcrypt.compare(password, adminPasswordHash);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
        { id: "admin", email: adminEmail, role: "admin" },
        process.env.ADMIN_JWT_SECRET,
        { expiresIn: "4h" }
    );

    res.json({
        success: true,
        message: "เข้าสู่ระบบ Admin สำเร็จ",
        token,
        admin: { email: adminEmail, role: "admin" },
    });
});

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get("/stats", authenticateAdmin, async (req, res) => {
    try {
        const { data: orders } = await supabase.from("orders").select("status, package_price");
        const { count: userCount } = await supabase.from("users").select("*", { count: 'exact', head: true });

        const stats = {
            totalUsers: userCount || 0,
            totalOrders: orders?.length || 0,
            totalRevenue: orders?.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.package_price, 0) || 0,
            ordersByStatus: {
                pending: orders?.filter(o => o.status === 'pending').length || 0,
                processing: orders?.filter(o => o.status === 'processing').length || 0,
                completed: orders?.filter(o => o.status === 'completed').length || 0,
                failed: orders?.filter(o => o.status === 'failed').length || 0,
            }
        };

        res.json({ success: true, data: stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get("/users", authenticateAdmin, async (req, res) => {
    const { data: users, error } = await supabase
        .from("users")
        .select("id, username, email, balance, created_at")
        .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, data: users, count: users.length });
});

// ─── PATCH /api/admin/users/:id/balance ──────────────────────────────────────
router.patch("/users/:id/balance", authenticateAdmin, async (req, res) => {
    const { balance } = req.body;
    const { data: user, error } = await supabase
        .from("users")
        .update({ balance, updated_at: new Date().toISOString() })
        .eq("id", req.params.id)
        .select()
        .single();

    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: "ปรับปรุงยอดเงินสำเร็จ", data: user });
});

// ─── PATCH /api/admin/users/:id/points ────────────────────────────────────────
router.patch("/users/:id/points", authenticateAdmin, async (req, res) => {
    const { points } = req.body;
    const { data: user, error } = await supabase
        .from("users")
        .update({ points, updated_at: new Date().toISOString() })
        .eq("id", req.params.id)
        .select()
        .single();

    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: "ปรับปรุงแต้มสำเร็จ", data: user });
});

// ─── GET /api/admin/settings ──────────────────────────────────────────────────
router.get("/settings", authenticateAdmin, async (req, res) => {
    const { data: settings, error } = await supabase
        .from("system_settings")
        .select("*");

    if (error) return res.status(500).json({ success: false, message: error.message });
    
    // Convert array to object key-value pairs
    const config = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {});

    res.json({ success: true, data: config });
});

// ─── PATCH /api/admin/settings ────────────────────────────────────────────────
router.patch("/settings", authenticateAdmin, async (req, res) => {
    const settings = req.body; // Expecting { key1: value1, key2: value2 }
    
    try {
        const updates = Object.entries(settings).map(([key, value]) => {
            return supabase
                .from("system_settings")
                .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        });

        await Promise.all(updates);
        res.json({ success: true, message: "บันทึกการตั้งค่าสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/admin/orders ────────────────────────────────────────────────────
router.get("/orders", authenticateAdmin, async (req, res) => {
    const { status, limit = 100 } = req.query;

    let query = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(limit);
    if (status) query = query.eq("status", status);

    const { data: orders, error } = await query;
    if (error) return res.status(500).json({ success: false, message: error.message });

    res.json({ success: true, data: orders, total: orders.length });
});

// ─── PATCH /api/admin/orders/:id/status ──────────────────────────────────────
router.patch("/orders/:id/status", authenticateAdmin, async (req, res) => {
    const { status } = req.body;
    const { data: order, error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", req.params.id)
        .select()
        .single();

    if (error) return res.status(500).json({ success: false, message: error.message });

    res.json({ success: true, message: "อัปเดตสำเร็จ", data: order });
});

router.get("/verify", authenticateAdmin, (req, res) => {
    res.json({ success: true, admin: req.admin });
});

// 5. อัปเดตราคาต้นทุน ขาย และส่วนลดสินค้า wePAY
router.patch("/products/override", authenticateAdmin, async (req, res) => {
    const { company_id, original_price, cost_price, selling_price, discount_price, discount_start, discount_end } = req.body;

    if (!company_id || original_price === undefined) {
        return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
    }

    try {
        const { data, error } = await supabase
            .from("product_overrides")
            .upsert({
                company_id,
                original_price,
                cost_price,
                selling_price,
                discount_price,
                discount_start: discount_start || null,
                discount_end: discount_end || null,
                updated_at: new Date()
            }, { onConflict: 'company_id,original_price' })
            .select()
            .single();

        if (error) throw error;
        res.json({ message: "อัปเดตราคาและส่วนลดสำเร็จ", data });
    } catch (error) {
        console.error("❌ Override Update Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 6. อัปเดตข้อมูลเกม (ชื่อ/รูปภาพ)
router.patch("/games/settings", authenticateAdmin, async (req, res) => {
    const { company_id, custom_name, custom_image_url } = req.body;

    if (!company_id) return res.status(400).json({ message: "ระบุ company_id" });

    try {
        const { data, error } = await supabase
            .from("game_settings")
            .upsert({
                company_id,
                custom_name,
                custom_image_url,
                updated_at: new Date()
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ message: "บันทึกการตั้งค่าตัวเลือกเกมสำเร็จ", data });
    } catch (error) {
        console.error("❌ Game Settings Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── Slider Management ────────────────────────────────────────────────────────

// GET /api/admin/sliders
router.get("/sliders", authenticateAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("sliders")
            .select("*")
            .order("order_index", { ascending: true });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/admin/sliders - Upload and Add Slider
router.post("/sliders", authenticateAdmin, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "กรุณาอัปโหลดรูปภาพ" });
        }

        const fileName = `${Date.now()}-${req.file.originalname}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("sliders")
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                cacheControl: "3600",
                upsert: false
            });

        if (uploadError) {
            if (uploadError.message === "Bucket not found") {
                return res.status(404).json({ 
                    success: false, 
                    message: "🚨 Storage Bucket 'sliders' ยังไม่ได้สร้างใน Supabase Storage! กรุณาสร้าง Bucket ก่อน" 
                });
            }
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from("sliders")
            .getPublicUrl(fileName);

        const { data, error } = await supabase
            .from("sliders")
            .insert([{
                image_url: publicUrl,
                link_url: req.body.link_url || null,
                order_index: req.body.order_index || 0,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, message: "เพิ่มรูปภาพสไลเดอร์สำเร็จ", data });
    } catch (err) {
        console.error("❌ Slider Upload Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/admin/sliders/:id
router.get("/sliders/delete/:id", authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Get the image URL to delete from storage
        const { data: slider, error: getError } = await supabase
            .from("sliders")
            .select("image_url")
            .eq("id", id)
            .single();

        if (getError) throw getError;

        if (slider && slider.image_url) {
            const fileName = slider.image_url.split("/").pop();
            await supabase.storage.from("sliders").remove([fileName]);
        }

        // 2. Delete from DB
        const { error: deleteError } = await supabase
            .from("sliders")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        res.json({ success: true, message: "ลบรูปภาพสไลเดอร์สำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── Discount Code Management ────────────────────────────────────────────────
router.get("/discounts", authenticateAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/discounts", authenticateAdmin, async (req, res) => {
    try {
        const { code, type, value, min_order_amount, max_discount, usage_limit, end_date, is_active, title, description, image_url } = req.body;
        const { data, error } = await supabase.from("discount_codes").insert([{
            code, type, value, min_order_amount, max_discount, usage_limit, end_date, is_active, title, description, image_url
        }]).select().single();
        if (error) throw error;
        res.json({ success: true, message: "สร้างโค้ดส่วนลดสำเร็จ", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.patch("/discounts/:id", authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from("discount_codes").update({ ...req.body, updated_at: new Date() }).eq("id", id).select().single();
        if (error) throw error;
        res.json({ success: true, message: "อัปเดตโค้ดส่วนลดสำเร็จ", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete("/discounts/:id", authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from("discount_codes").delete().eq("id", id);
        if (error) throw error;
        res.json({ success: true, message: "ลบโค้ดส่วนลดสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
