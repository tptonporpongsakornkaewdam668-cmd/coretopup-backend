const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { db } = require("../db");
const { authenticate } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { registerRules, loginRules } = require("../middleware/validate");

const router = express.Router();

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/register", authLimiter, registerRules, async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // 1. เช็คว่าอีเมลนี้มีอยู่แล้วหรือไม่
        const result = await db.execute({
            sql: "SELECT email FROM users WHERE email = ? LIMIT 1",
            args: [email]
        });

        if (result.rows.length > 0) {
            return res.status(409).json({ success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" });
        }

        // 2. แฮชรหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 12);

        // 3. บันทึกข้อมูลลง Turso
        const id = uuidv4();
        await db.execute({
            sql: "INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)",
            args: [id, email, hashedPassword, 'user']
        });

        // 4. สร้าง Token
        const token = jwt.sign(
            { id, email, username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            success: true,
            message: "สมัครสมาชิกสำเร็จ",
            token,
            user: { id, username, email, balance: 0, points: 0 },
        });
    } catch (error) {
        console.error("❌ Turso Register Error:", error);
        return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการสมัครสมาชิก", error: error.message });
    }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", authLimiter, loginRules, async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. ค้นหาผู้ใช้จากอีเมล
        const result = await db.execute({
            sql: "SELECT * FROM users WHERE email = ? LIMIT 1",
            args: [email]
        });

        const user = result.rows[0];

        if (!user) {
            await bcrypt.compare(password, "$2a$12$dummyhashforsecuritypurposes000000000000000000000000000");
            return res.status(401).json({ success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }

        // 2. เช็ครหัสผ่าน
        const isMatch = await bcrypt.compare(password, String(user.password));
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }

        // 3. สร้าง Token
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.email.split('@')[0] },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            message: "เข้าสู่ระบบสำเร็จ",
            token,
            user: { id: user.id, username: user.email.split('@')[0], email: user.email, balance: user.balance || 0, points: user.points || 0 },
        });
    } catch (error) {
        console.error("❌ Turso Login Error:", error);
        return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ", error: error.message });
    }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get("/me", authenticate, async (req, res) => {
    try {
        const result = await db.execute({
            sql: "SELECT id, email, balance, points, created_at FROM users WHERE id = ? LIMIT 1",
            args: [req.user.id]
        });

        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
        }

        res.json({
            success: true,
            user: {
                ...user,
                username: user.email.split('@')[0] // Fallback username ถ้าใน DB ไม่มีเก็บแยก
            },
        });
    } catch (error) {
        console.error("❌ Turso/Me Error:", error);
        return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาด" });
    }
});

module.exports = router;
