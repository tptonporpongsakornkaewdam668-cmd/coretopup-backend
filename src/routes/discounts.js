const express = require("express");
const { supabase } = require("../db");

const router = express.Router();

// GET /api/discounts - List all active discounts publicly
router.get("/", async (req, res) => {
    try {
        const now = new Date().toISOString();
        
        // Fetch discounts that are active and haven't expired
        const { data, error } = await supabase
            .from("discount_codes")
            .select("*")
            .eq("is_active", true)
            .or(`end_date.is.null,end_date.gte.${now}`)
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Optionally filter by usage_limit if you want to do it in the backend
        const activeDiscounts = data.filter(d => {
            if (d.usage_limit && d.usage_count >= d.usage_limit) return false;
            return true;
        });

        res.json({ success: true, data: activeDiscounts });
    } catch (err) {
        console.error("❌ Public Discounts Fetch Error:", err);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการโหลดข้อมูลส่วนลด" });
    }
});

module.exports = router;
