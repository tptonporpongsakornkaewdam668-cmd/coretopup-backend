const express = require("express");
const { supabase } = require("../db");

const router = express.Router();

// GET /api/sliders - Public sliders
router.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("sliders")
            .select("*")
            .order("order_index", { ascending: true });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
