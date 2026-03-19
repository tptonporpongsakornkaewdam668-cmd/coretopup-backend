const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateAdmin } = require("../middleware/adminAuth");
const { adminLoginRules } = require("../middleware/validate");
const { adminLimiter } = require("../middleware/rateLimiter");
const { db } = require("../db");
const multer = require("multer");

const router = express.Router();

// Multer storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
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
        const orderResult = await db.execute("SELECT status, amount FROM orders");
        const userResult = await db.execute("SELECT count(*) as count FROM users");
        
        const orders = orderResult.rows;
        const userCount = userResult.rows[0].count;

        const stats = {
            totalUsers: userCount || 0,
            totalOrders: orders?.length || 0,
            totalRevenue: orders?.filter(o => o.status === 'completed').reduce((sum, o) => sum + (Number(o.amount) || 0), 0) || 0,
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
    try {
        const result = await db.execute("SELECT id, username, email, balance, created_at FROM users ORDER BY created_at DESC");
        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── PATCH /api/admin/users/:id/balance ──────────────────────────────────────
router.patch("/users/:id/balance", authenticateAdmin, async (req, res) => {
    const { balance } = req.body;
    try {
        await db.execute({
            sql: "UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            args: [balance, req.params.id]
        });
        res.json({ success: true, message: "ปรับปรุงยอดเงินสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/admin/settings ──────────────────────────────────────────────────
router.get("/settings", authenticateAdmin, async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM system_settings");
        const config = result.rows.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json({ success: true, data: config });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── PATCH /api/admin/settings ────────────────────────────────────────────────
router.patch("/settings", authenticateAdmin, async (req, res) => {
    const settings = req.body;
    try {
        for (const [key, value] of Object.entries(settings)) {
            await db.execute({
                sql: "INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
                args: [key, value]
            });
        }
        res.json({ success: true, message: "บันทึกการตั้งค่าสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/admin/orders ────────────────────────────────────────────────────
router.get("/orders", authenticateAdmin, async (req, res) => {
    const { status, limit = 100 } = req.query;
    try {
        let sql = "SELECT * FROM orders";
        let args = [];
        if (status) {
            sql += " WHERE status = ?";
            args.push(status);
        }
        sql += " ORDER BY created_at DESC LIMIT ?";
        args.push(Number(limit));

        const result = await db.execute({ sql, args });
        res.json({ success: true, data: result.rows, total: result.rows.length });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── PATCH /api/admin/orders/:id/status ──────────────────────────────────────
router.patch("/orders/:id/status", authenticateAdmin, async (req, res) => {
    const { status } = req.body;
    try {
        await db.execute({
            sql: "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            args: [status, req.params.id]
        });
        res.json({ success: true, message: "อัปเดตสถานะสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── Slider Management ────────────────────────────────────────────────────────
router.get("/sliders", authenticateAdmin, async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM sliders ORDER BY id ASC");
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── Discount Code Management ────────────────────────────────────────────────
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
        const { code, type, value, min_order_amount, max_discount, usage_limit, end_date, is_active } = req.body;
        await db.execute({
            sql: "INSERT INTO discount_codes (code, type, value, min_order_amount, max_discount, usage_limit, end_date, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
            args: [code, type, value, min_order_amount, max_discount, usage_limit, end_date, is_active ? 1 : 0]
        });
        res.json({ success: true, message: "สร้างโค้ดส่วนลดสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
