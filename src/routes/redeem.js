const express = require("express");
const { processRedeem, initRedeemTables } = require("../services/redeemService");
const { redeemLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Initialize tables
initRedeemTables().catch(console.error);

/**
 * ─── Middleware: API Key Security ───────────────────────────────────────────
 * Only for requests from Games / Servers
 */
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers["x-api-key"] || req.headers["authorization"];
    if (!apiKey) {
        return res.status(401).json({ status: "error", message: "API Key required" });
    }

    const providedKey = apiKey.startsWith("Bearer ") ? apiKey.split(" ")[1] : apiKey;

    // 1. Check if key is the fixed env admin key (Optional fallback)
    const envSecret = process.env.REDEEM_API_KEY;
    if (envSecret && providedKey === envSecret) {
        return next();
    }

    // 2. Check the database for active API keys
    const { db } = require("../db");
    db.execute({
        sql: "SELECT id FROM api_keys WHERE key = ? AND status = 'active' LIMIT 1",
        args: [providedKey]
    }).then(result => {
        if (result.rows.length > 0) {
            // Update last used at (asynchronous background)
            db.execute({
                sql: "UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?",
                args: [result.rows[0].id]
            }).catch(console.error);
            
            return next();
        }
        return res.status(403).json({ status: "error", message: "Invalid API Key" });
    }).catch(err => {
        console.error("❌ API Key Validation Error:", err);
        return res.status(500).json({ status: "error", message: "Security Validation Error" });
    });
};

/**
 * ─── POST /api/redeem ───────────────────────────────────────────────────────
 * Main endpoint for redeeming reward codes
 */
router.post("/", redeemLimiter, validateApiKey, async (req, res) => {
    const { player_id, code } = req.body;

    if (!player_id || !code) {
        return res.status(400).json({ status: "invalid", message: "Missing player_id or code" });
    }

    try {
        const reqInfo = {
            ip: req.ip || req.headers['x-forwarded-for'],
            ua: req.headers['user-agent']
        };

        const result = await processRedeem(player_id.toString(), code.toString(), reqInfo);
        
        // 1. Respond to game FIRST
        res.json(result);

        // 2. Then update status in the background if success
        if (result.status === "success") {
            const { finalizeRedeem } = require("../services/redeemService");
            // Background update
            finalizeRedeem(player_id.toString(), code.toString()).catch(console.error);
        }

    } catch (err) {
        console.error("❌ Redeem Route Error:", err);
        if (!res.headersSent) {
            res.status(500).json({ status: "error", message: "Internal server error" });
        }
    }
});

module.exports = router;
