const rateLimit = require("express-rate-limit");

// ─── ป้องกัน Brute Force: Login / Register ────────────────────────────────────
// จำกัด 10 ครั้ง / 15 นาที ต่อ IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 10,
    message: { success: false, message: "พยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาที" },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── ป้องกัน API Spam: ทั่วไป ─────────────────────────────────────────────────
// จำกัด 100 ครั้ง / 1 นาที ต่อ IP
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 นาที
    max: 100,
    message: { success: false, message: "ส่ง Request มากเกินไป กรุณารอสักครู่" },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── ป้องกัน Order Spam ───────────────────────────────────────────────────────
// จำกัด 20 ครั้ง / 10 นาที ต่อ IP
const orderLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 นาที
    max: 20,
    message: { success: false, message: "สร้าง Order มากเกินไป กรุณารอ 10 นาที" },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── ป้องกัน Admin Login ──────────────────────────────────────────────────────
// จำกัด 5 ครั้ง / 30 นาที ต่อ IP (เข้มงวดที่สุด)
const adminLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 นาที
    max: 5,
    message: { success: false, message: "พยายาม Login Admin มากเกินไป กรุณารอ 30 นาที" },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── ป้องกัน API Spam: Redeem ───────────────────────────────────────────────────
// จำกัด 60 ครั้ง / 1 นาที ต่อ IP
const redeemLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { success: false, message: "Redeem มากเกินไป กรุณารอสักครู่" },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter, orderLimiter, adminLimiter, redeemLimiter };
