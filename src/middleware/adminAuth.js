const jwt = require("jsonwebtoken");

/**
 * Middleware: ตรวจสอบ Admin JWT Token
 * Admin token มี payload { id, role: "admin" }
 */
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "กรุณาเข้าสู่ระบบ Admin ก่อน" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        if (decoded.role !== "admin") {
            return res.status(403).json({ success: false, message: "ไม่มีสิทธิ์เข้าถึง Admin" });
        }
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Admin Token ไม่ถูกต้องหรือหมดอายุ" });
    }
};

module.exports = { authenticateAdmin };
