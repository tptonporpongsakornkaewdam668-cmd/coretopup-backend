const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const { db } = require("../db");
const { authenticate } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { registerRules, loginRules } = require("../middleware/validate");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/register", authLimiter, registerRules, async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const result = await db.execute({
            sql: "SELECT email FROM users WHERE email = ? LIMIT 1",
            args: [email]
        });

        if (result.rows.length > 0) {
            return res.status(409).json({ success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const id = uuidv4();
        await db.execute({
            sql: "INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)",
            args: [id, email, hashedPassword, 'user']
        });

        const token = jwt.sign(
            { id, email, username: email.split('@')[0] },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            success: true,
            message: "สมัครสมาชิกสำเร็จ",
            token,
            user: { id, username: email.split('@')[0], email, balance: 0, points: 0 },
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
        const result = await db.execute({
            sql: "SELECT * FROM users WHERE email = ? LIMIT 1",
            args: [email]
        });

        const user = result.rows[0];

        if (!user) {
            await bcrypt.compare(password, "$2a$12$dummyhashforsecuritypurposes000000000000000000000000000");
            return res.status(401).json({ success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }

        const isMatch = await bcrypt.compare(password, String(user.password));
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }

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

// ─── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post("/forgot-password", authLimiter, async (req, res) => {
    const { email } = req.body;

    try {
        const result = await db.execute({
            sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
            args: [email]
        });

        const user = result.rows[0];
        if (!user) {
            return res.status(404).json({ success: false, message: "ไม่พบอีเมลนี้ในระบบ" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await db.execute({
            sql: "UPDATE users SET resetToken = ?, resetTokenExpires = ? WHERE email = ?",
            args: [resetTokenHash, expires.toISOString(), email]
        });

        const resetUrl = `${process.env.RESET_PASSWORD_URL}?token=${resetToken}`;

        await transporter.sendMail({
            to: email,
            subject: "รีเซ็ตรหัสผ่านของคุณ",
            html: `<h1>คุณได้ทำรายการรีเซ็ตรหัสผ่าน</h1><p>กรุณากดที่ลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่าน:</p><a href="${resetUrl}">${resetUrl}</a><p>ลิงก์จะมีอายุการใช้งาน 1 ชั่วโมง</p>`,
        });

        res.json({ success: true, message: "ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว" });
    } catch (error) {
        console.error("❌ Forgot Password Error:", error);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการส่งอีเมล" });
    }
});

// ─── POST /api/auth/reset-password ─────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
    const { token, password } = req.body;
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

    try {
        const result = await db.execute({
            sql: "SELECT id FROM users WHERE resetToken = ? AND resetTokenExpires > ? LIMIT 1",
            args: [resetTokenHash, new Date().toISOString()]
        });

        const user = result.rows[0];
        if (!user) {
            return res.status(400).json({ success: false, message: "โทเคนไม่ถูกต้องหรือหมดอายุ" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        await db.execute({
            sql: "UPDATE users SET password = ?, resetToken = NULL, resetTokenExpires = NULL WHERE id = ?",
            args: [hashedPassword, user.id]
        });

        res.json({ success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" });
    } catch (error) {
        console.error("❌ Reset Password Error:", error);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาด" });
    }
});

// ─── POST /api/auth/google-login ──────────────────────────────────────────────
router.post("/google-login", async (req, res) => {
    const { idToken } = req.body;

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, sub: googleId, name, picture } = ticket.getPayload();

        let result = await db.execute({
            sql: "SELECT * FROM users WHERE email = ? LIMIT 1",
            args: [email]
        });

        let user = result.rows[0];

        if (!user) {
            const id = uuidv4();
            const dummyPassword = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
            await db.execute({
                sql: "INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)",
                args: [id, email, dummyPassword, 'user']
            });
            
            result = await db.execute({
                sql: "SELECT * FROM users WHERE id = ? LIMIT 1",
                args: [id]
            });
            user = result.rows[0];
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.email.split('@')[0] },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            token,
            user: { id: user.id, username: user.email.split('@')[0], email: user.email, balance: user.balance || 0, points: user.points || 0 },
        });
    } catch (error) {
        console.error("❌ Google Login Error:", error);
        res.status(400).json({ success: false, message: "การตรวจสอบสิทธิ์ล้มเหลว" });
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
                username: user.email.split('@')[0]
            },
        });
    } catch (error) {
        console.error("❌ Turso/Me Error:", error);
        return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาด" });
    }
});

module.exports = router;

