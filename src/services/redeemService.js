const { db } = require("../db");
const crypto = require("crypto");

/**
 * Initialize Redeem System Tables
 */
const initRedeemTables = async () => {
    try {
        // Table: redeem_products
        await db.execute(`
            CREATE TABLE IF NOT EXISTS redeem_products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                item_id TEXT NOT NULL,
                amount INTEGER NOT NULL DEFAULT 1,
                image_url TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Table: redeem_orders
        await db.execute(`
            CREATE TABLE IF NOT EXISTS redeem_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT NOT NULL UNIQUE,
                player_id TEXT NOT NULL,
                product_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Table: redeem_codes
        await db.execute(`
            CREATE TABLE IF NOT EXISTS redeem_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL UNIQUE,
                item_id TEXT NOT NULL,
                amount INTEGER NOT NULL DEFAULT 1,
                status TEXT NOT NULL DEFAULT 'unused',
                order_id TEXT,
                expire_date DATETIME,
                used_by TEXT,
                used_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Table: redeem_logs
        await db.execute(`
            CREATE TABLE IF NOT EXISTS redeem_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id TEXT NOT NULL,
                code TEXT NOT NULL,
                status TEXT NOT NULL,
                ip TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Table: api_keys
        await db.execute(`
            CREATE TABLE IF NOT EXISTS api_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                key TEXT NOT NULL UNIQUE,
                status TEXT NOT NULL DEFAULT 'active',
                last_used_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("✅ Redeem tables initialized");

        // Insert sample product if none exists
        const productCount = await db.execute("SELECT count(*) as count FROM redeem_products");
        if (productCount.rows[0].count === 0) {
            await db.execute({
                sql: "INSERT INTO redeem_products (name, description, price, item_id, amount) VALUES (?, ?, ?, ?, ?)",
                args: ["Starter Pack", "500 Coins Starter Pack", 49, "coin", 500]
            });
            await db.execute({
                sql: "INSERT INTO redeem_products (name, description, price, item_id, amount) VALUES (?, ?, ?, ?, ?)",
                args: ["Value Pack", "1500 Coins Value Pack", 129, "coin", 1500]
            });
            await db.execute({
                sql: "INSERT INTO redeem_products (name, description, price, item_id, amount) VALUES (?, ?, ?, ?, ?)",
                args: ["Premium Pack", "5000 Coins Premium Pack", 399, "coin", 5000]
            });
            console.log("🎁 Inserted sample products");
        }
    } catch (err) {
        console.error("❌ Failed to initialize Redeem tables:", err.message);
    }
};

/**
 * Generate a secure 15-character redeem code (A-Z + 0-9)
 * Uses crypto.randomBytes to ensure cryptographic randomness
 */
const generateSecureCode = async (orderId = null, expireDays = 30) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const CODE_LENGTH = 15;

    const generateRaw = () => {
        let code = "";
        const bytes = crypto.randomBytes(CODE_LENGTH * 2); // Extra entropy buffer
        for (let i = 0; i < CODE_LENGTH; i++) {
            code += chars[bytes[i] % chars.length];
        }
        return code;
    };

    let newCode = null;
    for (let attempt = 0; attempt < 20; attempt++) {
        const candidate = generateRaw();
        try {
            // Calculate expiry date
            const expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + expireDays);

            await db.execute({
                sql: "INSERT INTO redeem_codes (code, item_id, amount, order_id, expire_date) VALUES (?, ?, ?, ?, ?)",
                args: [candidate, "__PENDING__", 0, orderId, expireDate.toISOString()]
            });
            newCode = candidate;
            break;
        } catch (err) {
            if (err.message && err.message.includes("UNIQUE")) continue;
            throw err;
        }
    }

    if (!newCode) throw new Error("Could not generate unique code after 20 attempts");
    return newCode;
};

/**
 * Generate + bind code to a product (called after payment confirmed)
 */
const generateRedeemCode = async (itemId, amount = 1, orderId = null, expireDays = 30) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const CODE_LENGTH = 15;

    const generateRaw = () => {
        let code = "";
        const bytes = crypto.randomBytes(CODE_LENGTH * 2);
        for (let i = 0; i < CODE_LENGTH; i++) {
            code += chars[bytes[i] % chars.length];
        }
        return code;
    };

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + expireDays);

    let newCode = null;
    for (let attempt = 0; attempt < 20; attempt++) {
        const candidate = generateRaw();
        try {
            await db.execute({
                sql: "INSERT INTO redeem_codes (code, item_id, amount, order_id, expire_date) VALUES (?, ?, ?, ?, ?)",
                args: [candidate, itemId, amount, orderId, expireDate.toISOString()]
            });
            newCode = candidate;
            break;
        } catch (err) {
            if (err.message && err.message.includes("UNIQUE")) continue;
            throw err;
        }
    }

    if (!newCode) throw new Error("Could not generate unique code");
    return newCode;
};

/**
 * Atomic Redeem Code Core Logic
 * Uses UPDATE ... WHERE status='unused' to prevent race conditions
 */
const processRedeem = async (player_id, code, reqInfo = {}) => {
    const logAttempt = async (status) => {
        try {
            await db.execute({
                sql: "INSERT INTO redeem_logs (player_id, code, status, ip, user_agent) VALUES (?, ?, ?, ?, ?)",
                args: [player_id, code, status, reqInfo.ip || null, reqInfo.ua || null]
            });
        } catch (logErr) {
            console.error("❌ Log Error:", logErr.message);
        }
    };

    try {
        // Step 1: Check if code exists
        const codeRes = await db.execute({
            sql: "SELECT * FROM redeem_codes WHERE code = ? LIMIT 1",
            args: [code.toUpperCase().trim()]
        });

        if (codeRes.rows.length === 0) {
            await logAttempt("invalid");
            return { status: "invalid", message: "Invalid code" };
        }

        const codeData = codeRes.rows[0];

        // Step 2: Check expiry
        if (codeData.expire_date) {
            if (new Date(codeData.expire_date) < new Date()) {
                await logAttempt("expired");
                return { status: "expired", message: "Code has expired" };
            }
        }

        // Step 3: Check already used (quick pre-check)
        if (codeData.status === "used") {
            await logAttempt("used");
            return { status: "used", message: "Code has already been used" };
        }

        // Step 4: ATOMIC update – only succeeds if status is still 'unused'
        const updateRes = await db.execute({
            sql: `UPDATE redeem_codes 
                  SET status = 'used', used_by = ?, used_at = CURRENT_TIMESTAMP 
                  WHERE code = ? AND status = 'unused'`,
            args: [player_id, code.toUpperCase().trim()]
        });

        // If no rows were updated, someone else redeemed it first (race condition caught)
        if (!updateRes.rowsAffected || updateRes.rowsAffected === 0) {
            await logAttempt("used");
            return { status: "used", message: "Code has already been used" };
        }

        // Step 5: Log success
        await logAttempt("success");

        return {
            status: "success",
            message: "Redeem successful",
            reward: {
                item_id: codeData.item_id,
                amount: codeData.amount
            }
        };

    } catch (err) {
        console.error("❌ Redeem Error:", err);
        await logAttempt("error");
        throw err;
    }
};

/**
 * Legacy finalizeRedeem - kept for backward compatibility
 * The new processRedeem is fully atomic, so this is a no-op safety fallback
 */
const finalizeRedeem = async (player_id, code) => {
    // No longer needed - processRedeem handles atomic update
    console.log(`ℹ️ finalizeRedeem called for ${code} (atomic update already done)`);
};

module.exports = { initRedeemTables, processRedeem, generateRedeemCode, finalizeRedeem };
