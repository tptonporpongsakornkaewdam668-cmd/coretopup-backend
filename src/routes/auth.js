const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { supabase } = require("../db");
const { authenticate } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { registerRules, loginRules } = require("../middleware/validate");

const router = express.Router();

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/register", authLimiter, registerRules, async (req, res) => {
    const { username, email, password } = req.body;

    // 1. เช็คว่าอีเมลนี้มีอยู่แล้วหรือไม่
    const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .single();

    if (checkError && checkError.code !== "PGRST116") { // PGRST116 คือไม่พบข้อมูล (ซึ่งปกติสำหรับการเช็คซ้ำ)
        console.error("❌ Supabase Check Error:", checkError);
        return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล", error: checkError.message });
    }

    if (existingUser) {
        return res.status(409).json({ success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    // 2. แฮชรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. บันทึกข้อมูลลง Supabase
    const newUser = {
        id: uuidv4(),
        username,
        email,
        password: hashedPassword,
        created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from("users").insert([newUser]);

    if (insertError) {
        console.error("❌ Supabase Register Error (Insert):", insertError);
        return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล", error: insertError.message });
    }

    // 4. สร้าง Token
    const token = jwt.sign(
        { id: newUser.id, email: newUser.email, username: newUser.username },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.status(201).json({
        success: true,
        message: "สมัครสมาชิกสำเร็จ",
        token,
        user: { id: newUser.id, username: newUser.username, email: newUser.email, balance: 0 },
    });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", authLimiter, loginRules, async (req, res) => {
    const { email, password } = req.body;

    // 1. ค้นหาผู้ใช้จากอีเมล
    const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

    if (error || !user) {
        await bcrypt.compare(password, "$2a$12$dummyhashforsecuritypurposes000000000000000000000000000");
        return res.status(401).json({ success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    // 2. เช็ครหัสผ่าน
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    // 3. สร้าง Token
    const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.json({
        success: true,
        message: "เข้าสู่ระบบสำเร็จ",
        token,
        user: { id: user.id, username: user.username, email: user.email, balance: user.balance || 0 },
    });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get("/me", authenticate, async (req, res) => {
    const { data: user, error } = await supabase
        .from("users")
        .select("id, username, email, balance, created_at")
        .eq("id", req.user.id)
        .single();

    if (error || !user) {
        return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
    }

    res.json({
        success: true,
        user,
    });
});

module.exports = router;
