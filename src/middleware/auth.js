const jwt = require("jsonwebtoken");

/**
 * Middleware: ตรวจสอบ JWT Token จาก Authorization header
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "กรุณาเข้าสู่ระบบก่อน" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Token ไม่ถูกต้องหรือหมดอายุ" });
    }
};

module.exports = { authenticate };
