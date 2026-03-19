const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateAdmin } = require("../middleware/adminAuth");
const { adminLoginRules } = require("../middleware/validate");
const { adminLimiter } = require("../middleware/rateLimiter");
const { db } = require("../db");
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

    if (email !== adminEmail) {
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

    res.json({ success: true, message: "เข้าสู่ระบบ Admin สำเร็จ", token, admin: { email: adminEmail, role: "admin" } });
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

router.delete("/discounts/:id", authenticateAdmin, async (req, res) => {
    try {
        await db.execute({ sql: "DELETE FROM discount_codes WHERE id = ?", args: [req.params.id] });
        res.json({ success: true, message: "ลบโค้ดสำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
