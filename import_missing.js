require("dotenv").config();
const { createClient } = require("@libsql/client");

const db = createClient({ url: process.env.DATABASE_URL || "http://157.85.102.141:8080" });

const statements = [
  // ── sliders ──────────────────────────────────────────────────────────────
  `DROP TABLE IF EXISTS sliders`,
  `CREATE TABLE sliders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT,
    link_url TEXT,
    order_index INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `INSERT INTO sliders (id, image_url, link_url, order_index, is_active, created_at) VALUES (5, 'https://www.coinzonetopup.shop/slidebar/2.png', NULL, 2, 1, '2026-03-19 19:06:34')`,
  `INSERT INTO sliders (id, image_url, link_url, order_index, is_active, created_at) VALUES (7, 'https://img2.pic.in.th/Bronze750b29f375d0da40.png', '', 0, 1, '2026-03-29 14:38:01')`,

  // ── topups ───────────────────────────────────────────────────────────────
  `DROP TABLE IF EXISTS topups`,
  `CREATE TABLE topups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    amount DECIMAL,
    trans_ref TEXT UNIQUE,
    sender_name TEXT,
    sender_bank TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `INSERT INTO topups (id, user_id, amount, trans_ref, sender_name, sender_bank, status, created_at) VALUES (1, '657cf288-b973-4cb5-b9b4-de62a685ceb2', 1, '0460835o8lnur006D3wv', 'MR. PHONGSAKON K', 'ธนาคารกสิกรไทย', 'success', '2026-03-24 12:28:51')`,

  // ── fivem_packages ───────────────────────────────────────────────────────
  `DROP TABLE IF EXISTS fivem_packages`,
  `CREATE TABLE fivem_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    fivem_amount INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // ── fivem_keys ───────────────────────────────────────────────────────────
  `DROP TABLE IF EXISTS fivem_keys`,
  `CREATE TABLE fivem_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_code TEXT NOT NULL UNIQUE,
    package_id INTEGER NOT NULL,
    user_id TEXT,
    status TEXT NOT NULL DEFAULT 'unused',
    order_ref TEXT,
    used_at DATETIME,
    server_response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES fivem_packages(id)
  )`,

  // ── redeem_codes ─────────────────────────────────────────────────────────
  `DROP TABLE IF EXISTS redeem_codes`,
  `CREATE TABLE redeem_codes (
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
  )`,
  `INSERT INTO redeem_codes (id, code, item_id, amount, status, expire_date, used_by, used_at, created_at, order_id) VALUES (3, 'WELCOME2026', 'coin', 1000, 'revoked', '2026-12-31 23:59:59', NULL, NULL, '2026-03-29 09:48:20', NULL)`,
  `INSERT INTO redeem_codes (id, code, item_id, amount, status, expire_date, used_by, used_at, created_at, order_id) VALUES (4, 'DMBDX0EBN10S1TX', 'ldfks;ldkf', 8, 'used', '2026-04-28T14:14:50.189Z', 'UID-9999', '2026-03-29 14:30:57', '2026-03-29 14:14:50', 'ORD-1774793690050-4XS6')`,
  `INSERT INTO redeem_codes (id, code, item_id, amount, status, expire_date, used_by, used_at, created_at, order_id) VALUES (5, 'MQKXWAQGT1Y8QT1', 'ldfks;ldkf', 8, 'unused', '2026-04-28T14:48:35.055Z', NULL, NULL, '2026-03-29 14:48:35', 'ORD-1774795714902-HEQ7')`,

  // ── redeem_logs ──────────────────────────────────────────────────────────
  `DROP TABLE IF EXISTS redeem_logs`,
  `CREATE TABLE redeem_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    code TEXT NOT NULL,
    status TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `INSERT INTO redeem_logs (id, player_id, code, status, ip, user_agent, created_at) VALUES (1, 'UID-9999', 'DMBDX0EBN10S1TX', 'success', '::1', 'Mozilla/5.0', '2026-03-29 14:30:58')`,
  `INSERT INTO redeem_logs (id, player_id, code, status, ip, user_agent, created_at) VALUES (2, 'UID-9999', 'DMBDX0EBN10S1TX', 'used', '::1', 'Mozilla/5.0', '2026-03-29 14:31:10')`,
  `INSERT INTO redeem_logs (id, player_id, code, status, ip, user_agent, created_at) VALUES (3, 'UID-9999', 'DMBDX0EBN10S1T', 'invalid', '::1', 'Mozilla/5.0', '2026-03-29 14:31:16')`,

  // ── api_keys ─────────────────────────────────────────────────────────────
  `DROP TABLE IF EXISTS api_keys`,
  `CREATE TABLE api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME
  )`,
  `INSERT INTO api_keys (id, name, key, status, created_at, last_used_at) VALUES (2, 'หดแกปห', 'CZ-RD-CE58-FDLU', 'active', '2026-03-29 09:05:54', NULL)`,
  `INSERT INTO api_keys (id, name, key, status, created_at, last_used_at) VALUES (3, 'test', 'rsk_90bc42c79d60eaa3b0eb8efac930b34ef029130bfe88b01f', 'active', '2026-03-29 14:30:39', '2026-03-29 14:31:15')`,

  // ── redeem_products ──────────────────────────────────────────────────────
  `DROP TABLE IF EXISTS redeem_products`,
  `CREATE TABLE redeem_products (
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
  )`,
  `INSERT INTO redeem_products (id, name, description, price, item_id, amount, image_url, is_active, created_at, updated_at) VALUES (4, 'test product', 'kjv;dkflsdfk;lsdkf;lk;sdfk;lsf', 8888, 'ldfks;ldkf', 8, 'https://img2.pic.in.th/Bronze750b29f375d0da40.png', 1, '2026-03-29 14:05:27', '2026-03-29 14:10:47')`,

  // ── redeem_orders ────────────────────────────────────────────────────────
  `DROP TABLE IF EXISTS redeem_orders`,
  `CREATE TABLE redeem_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL UNIQUE,
    player_id TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `INSERT INTO redeem_orders (id, order_id, player_id, product_id, status, created_at, updated_at) VALUES (1, 'ORD-1774793690050-4XS6', 'ad25c3ae-032b-46af-9b9a-447faab7e570', 4, 'paid', '2026-03-29 14:14:50', '2026-03-29 14:14:50')`,
  `INSERT INTO redeem_orders (id, order_id, player_id, product_id, status, created_at, updated_at) VALUES (2, 'ORD-1774795714902-HEQ7', 'ad25c3ae-032b-46af-9b9a-447faab7e570', 4, 'paid', '2026-03-29 14:48:34', '2026-03-29 14:48:34')`,
];

async function run() {
  console.log(`🚀 Connecting to: ${process.env.DATABASE_URL}`);
  let ok = 0, fail = 0;
  for (const sql of statements) {
    try {
      await db.execute(sql);
      const preview = sql.slice(0, 60).replace(/\n\s+/g, " ");
      console.log(`✅ ${preview}`);
      ok++;
    } catch (err) {
      const preview = sql.slice(0, 60).replace(/\n\s+/g, " ");
      console.error(`❌ ${preview}`);
      console.error(`   → ${err.message}`);
      fail++;
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`✅ สำเร็จ: ${ok} | ❌ ล้มเหลว: ${fail}`);

  // verify
  try {
    const tables = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
    console.log(`\n📦 ตารางทั้งหมด: ${tables.rows.map(r => r.name).join(", ")}`);
  } catch(e) { console.error("verify fail:", e.message); }

  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
