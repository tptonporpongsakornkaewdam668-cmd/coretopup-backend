const express = require("express");
const { body, validationResult } = require("express-validator");
const { generateRedeemCode, processRedeem } = require("../services/redeemService");
const { redeemLimiter, apiLimiter } = require("../middleware/rateLimiter");
const { authenticateAdmin } = require("../middleware/adminAuth");
const { authenticate } = require("../middleware/auth");
const { getBalance, updateBalance } = require("../services/wallet");
const { db } = require("../db");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});


// ─── Middleware: API Key Authentication (for game server calls) ───────────────
const validateGameApiKey = async (req, res, next) => {
    const apiKey = req.headers["x-api-key"] || req.headers["authorization"];
    if (!apiKey) {
        return res.status(401).json({ status: "error", message: "API Key required" });
    }
    const providedKey = apiKey.startsWith("Bearer ") ? apiKey.split(" ")[1] : apiKey;

    // 1. Check env API key
    const envSecret = process.env.REDEEM_API_KEY;
    if (envSecret && providedKey === envSecret) return next();

    // 2. Check DB api_keys table
    try {
        const result = await db.execute({
            sql: "SELECT id FROM api_keys WHERE key = ? AND status = 'active' LIMIT 1",
            args: [providedKey]
        });
        if (result.rows.length > 0) {
            db.execute({
                sql: "UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?",
                args: [result.rows[0].id]
            }).catch(console.error);
            return next();
        }
    } catch (err) {
        console.error("❌ API Key Validation Error:", err);
        return res.status(500).json({ status: "error", message: "Security validation error" });
    }
    return res.status(403).json({ status: "error", message: "Invalid API Key" });
};

// ─── Input Validation Helper ──────────────────────────────────────────────────
const validate = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ status: "error", errors: errors.array() });
        return false;
    }
    return true;
};

// ══════════════════════════════════════════════════════════════════════════════
//  [1] PUBLIC SHOP APIs  (Customer-facing)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/redeem-shop/products
 * List all active products for the shop page
 */
router.get("/products", async (req, res) => {
    try {
        const result = await db.execute(
            "SELECT id, name, description, price, item_id, amount, image_url FROM redeem_products WHERE is_active = 1 ORDER BY price ASC"
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("❌ Get Products Error:", err);
        res.status(500).json({ success: false, message: "Error fetching products" });
    }
});

/**
 * POST /api/redeem-shop/buy-code
 * Deduct user balance and generate a redeem code
 */
router.post(
    "/buy-code",
    apiLimiter,
    authenticate,
    [
        body("product_id").isInt({ min: 1 }).withMessage("Valid product_id required")
    ],
    async (req, res) => {
        if (!validate(req, res)) return;

        const { product_id } = req.body;
        const userId = req.user.id; // From authenticate middleware

        try {
            // Verify product exists and is active
            const productRes = await db.execute({
                sql: "SELECT * FROM redeem_products WHERE id = ? AND is_active = 1 LIMIT 1",
                args: [product_id]
            });

            if (productRes.rows.length === 0) {
                return res.status(404).json({ success: false, message: "Product not found or inactive" });
            }

            const product = productRes.rows[0];
            const price = parseFloat(product.price);

            // Fetch current user balance
            const currentBalance = await getBalance(userId);
            if (currentBalance < price) {
                return res.status(400).json({ success: false, message: "Insufficient balance" });
            }

            // Deduct balance
            await updateBalance(userId, -price, `Bought redeem code for ${product.name}`);

            // Generate order ID
            const orderId = "ORD-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();

            // Insert paid order directly
            await db.execute({
                sql: "INSERT INTO redeem_orders (order_id, player_id, product_id, status) VALUES (?, ?, ?, 'paid')",
                args: [orderId, userId.toString(), product_id]
            });

            // Generate the redeem code
            const code = await generateRedeemCode(product.item_id, product.amount, orderId);

            // 📝 Add to main orders table for history visibility
            const historyOrderId = uuidv4();
            const productDataJson = JSON.stringify({ "Redeem Code": code });
            await db.execute({
                sql: `INSERT INTO orders (id, user_id, product_id, product_name, player_id, server, amount, status, transaction_id, provider, product_data, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                args: [
                    historyOrderId,
                    userId,
                    product_id.toString(),
                    product.name,
                    "-",
                    "Redeem Shop",
                    price,
                    "success",
                    code, // Show the code as transaction ID for easy reference in history
                    "redeem",
                    productDataJson
                ]
            });

            console.log(`✅ User ${userId} bought code for ${product.name} → Code: ${code}`);

            res.json({
                success: true,
                message: "Purchase successful",
                code,
                product_name: product.name,
                item_id: product.item_id,
                amount: product.amount,
                price
            });
        } catch (err) {
            console.error("❌ Buy Code Error:", err);
            res.status(500).json({ success: false, message: "Error processing code purchase" });
        }
    }
);

// ══════════════════════════════════════════════════════════════════════════════
//  [2] REDEEM API  (Called by Game Server)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/redeem-shop/redeem
 * Atomic redeem endpoint for game servers
 */
router.post(
    "/redeem",
    redeemLimiter,
    validateGameApiKey,
    [
        body("player_id").trim().notEmpty().withMessage("player_id required"),
        body("code").trim().notEmpty().withMessage("code required").isLength({ min: 5, max: 20 })
    ],
    async (req, res) => {
        if (!validate(req, res)) return;

        const { player_id, code } = req.body;
        const reqInfo = {
            ip: req.ip || req.headers["x-forwarded-for"],
            ua: req.headers["user-agent"]
        };

        try {
            const result = await processRedeem(player_id.toString(), code.toString(), reqInfo);
            res.json(result);
        } catch (err) {
            console.error("❌ Redeem Error:", err);
            if (!res.headersSent) {
                res.status(500).json({ status: "error", message: "Internal server error" });
            }
        }
    }
);

// ══════════════════════════════════════════════════════════════════════════════
//  [3] ADMIN APIs  (Product & Code Management)
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/redeem-shop/admin/products
router.get("/admin/products", authenticateAdmin, async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM redeem_products ORDER BY created_at DESC");
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/redeem-shop/admin/products
router.post("/admin/products", authenticateAdmin, upload.single("image"), async (req, res) => {
    let { name, description, price, item_id, amount, image_url, is_active } = req.body;
    if (!name || !price || !item_id || !amount) {
        return res.status(400).json({ success: false, message: "Missing required fields: name, price, item_id, amount" });
    }

    if (req.file) {
        const ext = path.extname(req.file.originalname) || ".jpg";
        const filename = `redeem_prod_${Date.now()}_${uuidv4().substring(0, 8)}${ext}`;
        const uploadDir = path.join(__dirname, "..", "public", "uploads", "products");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, req.file.buffer);
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        image_url = `${baseUrl}/uploads/products/${filename}`;
    }

    try {
        await db.execute({
            sql: "INSERT INTO redeem_products (name, description, price, item_id, amount, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [name, description || null, parseFloat(price), item_id, parseInt(amount), image_url || null, is_active !== false && is_active !== 'false' && is_active !== '0' ? 1 : 0]
        });
        res.json({ success: true, message: "Product created successfully" });
    } catch (err) {
        console.error("❌ Create Product Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// PATCH /api/redeem-shop/admin/products/:id
router.patch("/admin/products/:id", authenticateAdmin, upload.single("image"), async (req, res) => {
    let { name, description, price, item_id, amount, image_url, is_active } = req.body;
    
    if (req.file) {
        const ext = path.extname(req.file.originalname) || ".jpg";
        const filename = `redeem_prod_${Date.now()}_${uuidv4().substring(0, 8)}${ext}`;
        const uploadDir = path.join(__dirname, "..", "public", "uploads", "products");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, req.file.buffer);
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        image_url = `${baseUrl}/uploads/products/${filename}`;
    }

    try {
        await db.execute({
            sql: `UPDATE redeem_products 
                  SET name = COALESCE(?, name), 
                      description = COALESCE(?, description), 
                      price = COALESCE(?, price), 
                      item_id = COALESCE(?, item_id), 
                      amount = COALESCE(?, amount), 
                      image_url = COALESCE(?, image_url),
                      is_active = COALESCE(?, is_active),
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = ?`,
            args: [
                name || null, 
                description || null, 
                price ? parseFloat(price) : null, 
                item_id || null, 
                amount ? parseInt(amount) : null, 
                image_url || null, 
                is_active !== undefined ? (is_active !== false && is_active !== 'false' && is_active !== '0' ? 1 : 0) : null, 
                req.params.id
            ]
        });
        res.json({ success: true, message: "Product updated successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/redeem-shop/admin/products/:id
router.delete("/admin/products/:id", authenticateAdmin, async (req, res) => {
    try {
        await db.execute({ sql: "DELETE FROM redeem_products WHERE id = ?", args: [req.params.id] });
        res.json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/redeem-shop/admin/codes
router.get("/admin/codes", authenticateAdmin, async (req, res) => {
    try {
        const { status, search, limit = 100 } = req.query;
        let sql = "SELECT * FROM redeem_codes WHERE 1=1";
        const args = [];
        if (status) { sql += " AND status = ?"; args.push(status); }
        if (search) { sql += " AND (code LIKE ? OR order_id LIKE ? OR used_by LIKE ?)"; args.push(`%${search}%`, `%${search}%`, `%${search}%`); }
        sql += ` ORDER BY created_at DESC LIMIT ?`;
        args.push(parseInt(limit));
        const result = await db.execute({ sql, args });
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/redeem-shop/admin/codes/generate
// Admin manually generates a code for a product
router.post("/admin/codes/generate", authenticateAdmin, async (req, res) => {
    const { product_id, expire_days = 30 } = req.body;
    if (!product_id) {
        return res.status(400).json({ success: false, message: "product_id required" });
    }
    try {
        const productRes = await db.execute({
            sql: "SELECT * FROM redeem_products WHERE id = ? LIMIT 1",
            args: [product_id]
        });
        if (productRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        const product = productRes.rows[0];
        const code = await generateRedeemCode(product.item_id, product.amount, null, parseInt(expire_days));
        res.json({ success: true, code, item_id: product.item_id, amount: product.amount });
    } catch (err) {
        console.error("❌ Manual Generate Code Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// PATCH /api/redeem-shop/admin/codes/:code/revoke
router.patch("/admin/codes/:code/revoke", authenticateAdmin, async (req, res) => {
    try {
        await db.execute({
            sql: "UPDATE redeem_codes SET status = 'revoked' WHERE code = ?",
            args: [req.params.code]
        });
        res.json({ success: true, message: "Code revoked" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/redeem-shop/admin/orders
router.get("/admin/orders", authenticateAdmin, async (req, res) => {
    try {
        const { status, limit = 100 } = req.query;
        let sql = `
            SELECT o.*, p.name as product_name, p.price, p.item_id, p.amount,
                   c.code as redeem_code, c.status as code_status
            FROM redeem_orders o
            LEFT JOIN redeem_products p ON o.product_id = p.id
            LEFT JOIN redeem_codes c ON c.order_id = o.order_id
            WHERE 1=1
        `;
        const args = [];
        if (status) { sql += " AND o.status = ?"; args.push(status); }
        sql += " ORDER BY o.created_at DESC LIMIT ?";
        args.push(parseInt(limit));
        const result = await db.execute({ sql, args });
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/redeem-shop/admin/logs
router.get("/admin/logs", authenticateAdmin, async (req, res) => {
    try {
        const { limit = 100 } = req.query;
        const result = await db.execute({
            sql: "SELECT * FROM redeem_logs ORDER BY created_at DESC LIMIT ?",
            args: [parseInt(limit)]
        });
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/redeem-shop/admin/stats
router.get("/admin/stats", authenticateAdmin, async (req, res) => {
    try {
        const [totalCodes, unusedCodes, usedCodes, totalOrders, paidOrders, recentLogs] = await Promise.all([
            db.execute("SELECT count(*) as count FROM redeem_codes"),
            db.execute("SELECT count(*) as count FROM redeem_codes WHERE status = 'unused'"),
            db.execute("SELECT count(*) as count FROM redeem_codes WHERE status = 'used'"),
            db.execute("SELECT count(*) as count FROM redeem_orders"),
            db.execute("SELECT count(*) as count FROM redeem_orders WHERE status = 'paid'"),
            db.execute("SELECT count(*) as count FROM redeem_logs WHERE status = 'success'")
        ]);
        res.json({
            success: true,
            data: {
                totalCodes: totalCodes.rows[0].count,
                unusedCodes: unusedCodes.rows[0].count,
                usedCodes: usedCodes.rows[0].count,
                totalOrders: totalOrders.rows[0].count,
                paidOrders: paidOrders.rows[0].count,
                successfulRedeems: recentLogs.rows[0].count
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ──────────────────── API Key Management ────────────────────────────────────

// GET /api/redeem-shop/admin/api-keys
router.get("/admin/api-keys", authenticateAdmin, async (req, res) => {
    try {
        const result = await db.execute("SELECT id, name, key, status, last_used_at, created_at FROM api_keys ORDER BY created_at DESC");
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/redeem-shop/admin/api-keys
router.post("/admin/api-keys", authenticateAdmin, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "name required" });
    try {
        const key = "rsk_" + crypto.randomBytes(24).toString("hex");
        await db.execute({
            sql: "INSERT INTO api_keys (name, key, status) VALUES (?, ?, 'active')",
            args: [name, key]
        });
        res.json({ success: true, key, message: "API Key created – save this key, it won't be shown again" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/redeem-shop/admin/api-keys/:id
router.delete("/admin/api-keys/:id", authenticateAdmin, async (req, res) => {
    try {
        await db.execute({ sql: "DELETE FROM api_keys WHERE id = ?", args: [req.params.id] });
        res.json({ success: true, message: "API Key deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
