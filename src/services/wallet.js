const { supabase } = require("../db");

/**
 * Wallet Service - จัดการยอดเงินคงเหลือของผู้ใช้อย่างปลอดภัย
 */

// 1. ตรวจสอบยอดเงินปัจจุบัน
async function getBalance(userId) {
    const { data, error } = await supabase
        .from("users")
        .select("balance")
        .eq("id", userId)
        .single();

    if (error) throw error;
    return parseFloat(data.balance || 0);
}

// 2. ปรับปรุงยอดเงิน (ยอดบวก = เติมเงิน, ยอดลบ = ซื้อของ)
async function updateBalance(userId, amount, description = "") {
    try {
        // ใช้ RPC หรือ Transaction เพื่อความปลอดภัยระดับสูงสุด (Concurrency Safety)
        // แต่สำหรับ Supabase Client พื้นฐาน เราจะใช้การดึงและอัปเดต โดยตรวจสอบสถานะ

        const currentBalance = await getBalance(userId);
        const newBalance = currentBalance + amount;

        if (newBalance < 0) {
            throw new Error("ยอดเงินไม่เพียงพอสำหรับทำรายการนี้");
        }

        const { data, error } = await supabase
            .from("users")
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq("id", userId)
            .select()
            .single();

        if (error) throw error;

        console.log(`💰 [Wallet] User ${userId}: ${amount > 0 ? '+' : ''}${amount} | New Balance: ${newBalance}`);
        return data.balance;
    } catch (err) {
        console.error("❌ Wallet Update Error:", err.message);
        throw err;
    }
}

module.exports = {
    getBalance,
    updateBalance,
};
