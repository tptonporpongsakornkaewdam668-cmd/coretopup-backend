const express = require("express");
const { supabase } = require("../db");
const { getCached, invalidate } = require("../services/cache");

const router = express.Router();
const CACHE_KEY = "sliders:all";

// GET /api/sliders - Public sliders (cached 10 min)
router.get("/", async (req, res) => {
    try {
        const data = await getCached(CACHE_KEY, async () => {
            const { data, error } = await supabase
                .from("sliders")
                .select("*")
                .order("order_index", { ascending: true });
            if (error) throw error;
            return data;
        }, 10 * 60 * 1000); // 10 minutes

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/sliders/cache/clear - Admin: ล้าง cache sliders
router.post("/cache/clear", (req, res) => {
    invalidate(CACHE_KEY);
    res.json({ success: true, message: "Slider cache cleared" });
});

module.exports = router;

