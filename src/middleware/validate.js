const { body, validationResult } = require("express-validator");

// ─── Helper: ส่ง error ถ้า validate ล้มเหลว ──────────────────────────────────
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg, // ส่ง error แรกก่อน
            errors: errors.array(),
        });
    }
    next();
};

// ─── Rules: Register ──────────────────────────────────────────────────────────
const registerRules = [
    body("username")
        .trim()
        .notEmpty().withMessage("กรุณากรอกชื่อผู้ใช้")
        .isLength({ min: 3, max: 30 }).withMessage("ชื่อผู้ใช้ต้องมี 3-30 ตัวอักษร")
        .matches(/^[a-zA-Z0-9_ก-ฮเ-็็่้๊๋์ ]+$/).withMessage("ชื่อผู้ใช้มีอักขระที่ไม่อนุญาต"),
    body("email")
        .trim()
        .notEmpty().withMessage("กรุณากรอกอีเมล")
        .isEmail().withMessage("รูปแบบอีเมลไม่ถูกต้อง")
        .normalizeEmail(),
    body("password")
        .notEmpty().withMessage("กรุณากรอกรหัสผ่าน")
        .isLength({ min: 6, max: 100 }).withMessage("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
    handleValidation,
];

// ─── Rules: Login ─────────────────────────────────────────────────────────────
const loginRules = [
    body("email")
        .trim()
        .notEmpty().withMessage("กรุณากรอกอีเมล")
        .isEmail().withMessage("รูปแบบอีเมลไม่ถูกต้อง")
        .normalizeEmail(),
    body("password")
        .notEmpty().withMessage("กรุณากรอกรหัสผ่าน")
        .isLength({ max: 100 }).withMessage("รหัสผ่านยาวเกินไป"),
    handleValidation,
];

// ─── Rules: Create Order ──────────────────────────────────────────────────────
const orderRules = [
    body("gameSlug")
        .trim()
        .notEmpty().withMessage("กรุณาระบุเกม")
        .matches(/^[a-z0-9-]+$/).withMessage("gameSlug ไม่ถูกต้อง"),
    body("packageId")
        .trim()
        .notEmpty().withMessage("กรุณาเลือกแพ็กเกจ"),
    body("packageName")
        .trim()
        .notEmpty().withMessage("packageName ไม่ถูกต้อง")
        .isLength({ max: 100 }).withMessage("packageName ยาวเกินไป"),
    body("packagePrice")
        .isFloat({ min: 1, max: 100000 }).withMessage("ราคาต้องอยู่ระหว่าง 1 - 100,000"),
    body("playerId")
        .trim()
        .notEmpty().withMessage("กรุณากรอก Player ID")
        .isLength({ max: 100 }).withMessage("Player ID ยาวเกินไป")
        .escape(),
    body("paymentMethod")
        .trim()
        .notEmpty().withMessage("กรุณาเลือกช่องทางชำระเงิน")
        .isIn(["qr", "truemoney", "bank"]).withMessage("ช่องทางชำระเงินไม่ถูกต้อง"),
    body("server")
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage("Server name ยาวเกินไป")
        .escape(),
    handleValidation,
];

// ─── Rules: Admin Login ───────────────────────────────────────────────────────
const adminLoginRules = [
    body("email")
        .trim()
        .notEmpty().withMessage("กรุณากรอกอีเมล Admin")
        .isEmail().withMessage("รูปแบบอีเมลไม่ถูกต้อง")
        .normalizeEmail(),
    body("password")
        .notEmpty().withMessage("กรุณากรอกรหัสผ่าน"),
    handleValidation,
];

module.exports = { registerRules, loginRules, orderRules, adminLoginRules };
