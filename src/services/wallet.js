const { supabase } = require("../db");

/**
 * Wallet Service - จัดการยอดเงินคงเหลือของผู้ใช้อย่างปลอดภัย
 */

// 1. ตรวจสอบยอดเงินปัจจุบัน
async function getBalance(userId) {
    try {
        const result = await db.execute({
            sql: "SELECT balance FROM users WHERE id = ? LIMIT 1",
            args: [userId]
        });

        if (result.rows.length === 0) return 0;
        return Number(result.rows[0].balance || 0);
    } catch (error) {
        console.error("❌ Turso getBalance Error:", error);
        throw error;
    }
}

// 2. ปรับปรุงยอดเงิน (ยอดบวก = เติมเงิน, ยอดลบ = ซื้อของ)
async function updateBalance(userId, amount, description = "") {
    try {
        // ดึงยอดเงินปัจจุบันมาเช็คก่อน (สำหรับกรณีที่ยอดติดลบ)
        const currentBalance = await getBalance(userId);
        const newBalance = currentBalance + amount;

        if (newBalance < 0) {
            throw new Error("ยอดเงินไม่เพียงพอสำหรับทำรายการนี้");
        }

        // อัปเดตยอดเงินแบบ Atomic (ใช้ SQL ป้องกันการหักเงินซ้อน)
        await db.execute({
            sql: "UPDATE users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            args: [amount, userId]
        });

        console.log(`💰 [Wallet-Turso] User ${userId}: ${amount > 0 ? '+' : ''}${amount} | Status: Success`);
        return newBalance;
    } catch (err) {
        console.error("❌ Turso Wallet Update Error:", err.message);
        throw err;
    }
}

module.exports = {
    getBalance,
    updateBalance,
};
