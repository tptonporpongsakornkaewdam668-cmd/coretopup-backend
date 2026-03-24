const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateAdmin } = require("../middleware/adminAuth");
const { adminLoginRules } = require("../middleware/validate");
const { adminLimiter } = require("../middleware/rateLimiter");
const { db } = require("../db");
const { invalidate } = require("../services/cache");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// ─── POST /api/admin/login ────────────────────────────────────────────────────
router.post("/login", adminLimiter, adminLoginRules, async (req, res) => {
    const { email, password } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    let user = null;
    let isEnvAdmin = false;

    // 1. Check if it's the fixed env admin
    if (email === adminEmail) {
        isEnvAdmin = true;
        user = { id: "admin", email: adminEmail, role: "admin", password: adminPasswordHash };
    } else {
        // 2. Check the database for a user with the 'admin' role
        try {
            const { rows } = await db.execute({
                sql: "SELECT * FROM users WHERE email = ? AND role = 'admin' LIMIT 1",
                args: [email]
            });
            if (rows.length > 0) {
                user = rows[0];
            }
        } catch (err) {
            console.error("❌ Admin Login DB Error:", err);
        }
    }

    if (!user) {
        return res.status(401).json({ success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, role: "admin" },
        process.env.ADMIN_JWT_SECRET,
        { expiresIn: "4h" }
    );

    res.json({ success: true, message: "เข้าสู่ระบบ Admin สำเร็จ", token, admin: { email: user.email, role: "admin" } });
});

router.get("/verify", authenticateAdmin, (req, res) => {
    res.json({ success: true, admin: req.admin });
});

// ─── Stats ───
router.get("/stats", authenticateAdmin, async (req, res) => {
    try {
        const orderRes = await db.execute("SELECT status, amount FROM orders");
        const userRes = await db.execute("SELECT count(*) as count FROM users");
        const orders = orderRes.rows;
        const totalUsers = userRes.rows[0].count;

        const stats = {
            totalUsers,
            totalOrders: orders.length,
            totalRevenue: orders.filter(o => o.status === 'success' || o.status === 'completed').reduce((sum, o) => sum + (Number(o.amount) || 0), 0),
            ordersByStatus: {
                pending: orders.filter(o => o.status === 'pending').length,
                success: orders.filter(o => o.status === 'success' || o.status === 'completed').length,
                failed: orders.filter(o => o.status === 'failed').length,
            }
        };
        res.json({ success: true, data: stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── Users ───
router.get("/users", authenticateAdmin, async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM users ORDER BY created_at DESC");
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.patch("/users/:id/balance", authenticateAdmin, async (req, res) => {
    try {
        await db.execute({ sql: "UPDATE users SET balance = ? WHERE id = ?", args: [req.body.balance, req.params.id] });
        res.json({ success: true, message: "ปรับยอดเงินสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.patch("/users/:id/points", authenticateAdmin, async (req, res) => {
    try {
        await db.execute({ sql: "UPDATE users SET points = ? WHERE id = ?", args: [req.body.points, req.params.id] });
        res.json({ success: true, message: "ปรับแต้มสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── Orders ───
router.get("/orders", authenticateAdmin, async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM orders ORDER BY created_at DESC LIMIT 100");
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.patch("/orders/:id/status", authenticateAdmin, async (req, res) => {
    try {
        await db.execute({ sql: "UPDATE orders SET status = ? WHERE id = ?", args: [req.body.status, req.params.id] });
        res.json({ success: true, message: "อัปเดตสถานะสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── Settings ───
router.get("/settings", authenticateAdmin, async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM system_settings");
        const config = result.rows.reduce((acc, curr) => { acc[curr.key] = curr.value; return acc; }, {});
        res.json({ success: true, data: config });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.patch("/settings", authenticateAdmin, async (req, res) => {
    try {
        for (const [key, value] of Object.entries(req.body)) {
            await db.execute({
                sql: "INSERT INTO system_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                args: [key, value]
            });
        }
        res.json({ success: true, message: "บันทึกการตั้งค่าสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── Sliders ───
router.get("/sliders", authenticateAdmin, async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM sliders ORDER BY order_index ASC");
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/sliders", authenticateAdmin, async (req, res) => {
    try {
        const { image_url, link_url, order_index } = req.body;
        await db.execute({
            sql: "INSERT INTO sliders (image_url, link_url, order_index) VALUES (?, ?, ?)",
            args: [image_url, link_url, order_index || 0]
        });
        res.json({ success: true, message: "เพิ่มสไลเดอร์สำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete("/sliders/:id", authenticateAdmin, async (req, res) => {
    try {
        await db.execute({ sql: "DELETE FROM sliders WHERE id = ?", args: [req.params.id] });
        res.json({ success: true, message: "ลบสไลเดอร์สำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── Discounts ───
router.get("/discounts", authenticateAdmin, async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM discount_codes ORDER BY created_at DESC");
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/discounts", authenticateAdmin, async (req, res) => {
    try {
        const { code, type, value, is_active } = req.body;
        await db.execute({
            sql: "INSERT INTO discount_codes (code, type, value, is_active) VALUES (?, ?, ?, ?)",
            args: [code, type, value, is_active ? 1 : 0]
        });
        res.json({ success: true, message: "เพิ่มโค้ดสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── Products & Settings ───
router.get("/game-settings", authenticateAdmin, async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM game_settings");
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.patch("/products/override", authenticateAdmin, async (req, res) => {
    try {
        const { 
            company_id, 
            original_price, 
            selling_price, 
            cost_price, 
            discount_price, 
            discount_start, 
            discount_end,
            custom_image_url
        } = req.body;

        if (!company_id || original_price === undefined) {
            console.warn("⚠️ Invalid Product Override Data:", req.body);
            return res.status(400).json({ success: false, message: "Missing company_id or original_price" });
        }

        // 1. Update/Insert Product Override
        await db.execute({
            sql: `INSERT INTO product_overrides 
                  (company_id, original_price, selling_price, cost_price, discount_price, discount_start, discount_end, custom_image_url) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(company_id, original_price) DO UPDATE SET 
                  selling_price = excluded.selling_price, 
                  cost_price = excluded.cost_price, 
                  discount_price = excluded.discount_price, 
                  discount_start = excluded.discount_start, 
                  discount_end = excluded.discount_end,
                  custom_image_url = excluded.custom_image_url`,
            args: [
                company_id, original_price, 
                selling_price || null, 
                cost_price || null, 
                discount_price || null, 
                discount_start || null, 
                discount_end || null,
                custom_image_url || null
            ]
        });

        // Invalidate cache so updated price/image is immediately visible
        invalidate("wepay:game_list");
        invalidate("wepay:cashcard_list");
        invalidate("peamsub:app-premium");
        invalidate("peamsub:game");
        invalidate("peamsub:cashcard");
        invalidate("peamsub:mobile");

        res.json({ success: true, message: "บันทึกการตั้งค่าราคาแล้ว" });
    } catch (err) {
        console.error("❌ Product Override Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete("/discounts/:id", authenticateAdmin, async (req, res) => {
    try {
        await db.execute({ sql: "DELETE FROM discount_codes WHERE id = ?", args: [req.params.id] });
        res.json({ success: true, message: "ลบโค้ดสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// ─── Admin Management ───
// GET /api/admin/admins - List all accounts with admin role
router.get("/admins", authenticateAdmin, async (req, res) => {
    try {
        const { rows } = await db.execute("SELECT id, email, created_at, role FROM users WHERE role = 'admin'");
        res.json({ success: true, admins: rows });
    } catch (err) {
        console.error("❌ List Admins Error:", err);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการดึงรายชื่อ Admin" });
    }
});

// POST /api/admin/create-admin - Create a new admin account in users table
router.post("/create-admin", authenticateAdmin, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "กรุณาระบุอีเมลและรหัสผ่าน" });
    }

    try {
        // Check if exists
        const check = await db.execute({ 
            sql: "SELECT email FROM users WHERE email = ? LIMIT 1", 
            args: [email] 
        });
        
        if (check.rows.length > 0) {
            return res.status(409).json({ success: false, message: "อีเมลนี้มีอยู่ในระบบแล้ว" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const id = uuidv4();
        
        await db.execute({
            sql: "INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)",
            args: [id, email, hashedPassword, "admin"]
        });

        res.status(201).json({ success: true, message: "สร้างบัญชี Admin ใหม่สำเร็จ" });
    } catch (err) {
        console.error("❌ Create Admin Error:", err);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการสร้าง Admin" });
    }
});

// DELETE /api/admin/admins/:id - Delete an admin account
router.delete("/admins/:id", authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // Prevent deleting the main admin if necessary? We'll allow it for now except by ID if it's the fixed one
        // (The fixed one isn't in users table yet, so this is safe)
        await db.execute({ sql: "DELETE FROM users WHERE id = ? AND role = 'admin'", args: [id] });
        res.json({ success: true, message: "ลบบัญชี Admin สำเร็จ" });
    } catch (err) {
        console.error("❌ Delete Admin Error:", err);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาด" });
    }
});

module.exports = router;
