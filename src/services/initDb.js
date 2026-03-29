const { db } = require("../db");

/**
 * Initialize ALL database tables on startup.
 * Safe to run multiple times (IF NOT EXISTS).
 */
const initAllTables = async () => {
    console.log("🗄️  Initializing database tables...");

    const tables = [
        // ── users ─────────────────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            balance DECIMAL(15,2) DEFAULT 0.00,
            points INTEGER DEFAULT 0,
            role TEXT DEFAULT 'user',
            username TEXT,
            resetToken TEXT,
            resetTokenExpires DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // ── orders ────────────────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            product_id TEXT,
            product_name TEXT,
            player_id TEXT,
            server TEXT,
            amount DECIMAL(10,2),
            status TEXT DEFAULT 'pending',
            transaction_id TEXT,
            provider TEXT DEFAULT 'wepay',
            user_email TEXT DEFAULT NULL,
            username TEXT DEFAULT NULL,
            game_name TEXT DEFAULT NULL,
            package_name TEXT DEFAULT NULL,
            price NUMERIC DEFAULT NULL,
            product_data TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`,

        // ── history ───────────────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            type TEXT,
            amount DECIMAL(10,2),
            description TEXT,
            status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`,

        // ── game_settings ─────────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS game_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id TEXT UNIQUE,
            game_name TEXT,
            profit_percent DECIMAL(5,2) DEFAULT 0.00,
            profit_fixed DECIMAL(10,2) DEFAULT 0.00,
            is_active BOOLEAN DEFAULT 1,
            custom_name TEXT DEFAULT NULL,
            custom_image_url TEXT DEFAULT NULL
        )`,

        // ── product_overrides ─────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS product_overrides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id TEXT,
            original_price DECIMAL,
            selling_price DECIMAL,
            discount_price DECIMAL,
            discount_start DATETIME,
            discount_end DATETIME,
            cost_price DECIMAL,
            custom_image_url TEXT DEFAULT NULL
        )`,

        // ── system_settings ───────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`,

        // ── discount_codes ────────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS discount_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE,
            type TEXT,
            value DECIMAL,
            min_order_amount DECIMAL,
            max_discount DECIMAL,
            usage_limit INTEGER,
            usage_count INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            end_date DATETIME,
            title TEXT,
            description TEXT,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // ── sliders ───────────────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS sliders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_url TEXT,
            link_url TEXT,
            order_index INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // ── topups ────────────────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS topups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            amount DECIMAL,
            trans_ref TEXT UNIQUE,
            sender_name TEXT,
            sender_bank TEXT,
            status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // ── fivem_packages ────────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS fivem_packages (
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

        // ── fivem_keys ────────────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS fivem_keys (
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

        // ── redeem_products ───────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS redeem_products (
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

        // ── redeem_orders ─────────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS redeem_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL UNIQUE,
            player_id TEXT NOT NULL,
            product_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // ── redeem_codes ──────────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS redeem_codes (
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

        // ── redeem_logs ───────────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS redeem_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id TEXT NOT NULL,
            code TEXT NOT NULL,
            status TEXT NOT NULL,
            ip TEXT,
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // ── api_keys ──────────────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS api_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            key TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_used_at DATETIME
        )`,
    ];

    // Create all tables
    for (const sql of tables) {
        try {
            await db.execute(sql);
        } catch (err) {
            console.error(`❌ Table init error: ${err.message}`);
            throw err;
        }
    }

    // ── Seed: system_settings ─────────────────────────────────────────────────
    await db.execute(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('point_earn_threshold', '30')`);
    await db.execute(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('point_earn_rate', '1')`);
    await db.execute(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('point_redeem_rate', '0.01')`);

    // ── Seed: game_settings ───────────────────────────────────────────────────
    const games = [
        ['ACERACER','Ace Racer','https://play-lh.googleusercontent.com/tmTk1vNc6Nkl8wctgd_oXcp1Dl_xTYL4f1ECntGCmMNSQCfGUtvhSoNHCF9N9ATi8T4g'],
        ['AFKJOURNEY','AFK Journey','https://upload.wikimedia.org/wikipedia/en/9/99/AFK_Journey_app_icon.jpg'],
        ['ARENABO','Arena Breakout','https://www.game-ded.com/wordpress/wp-content/uploads/2024/04/ABI18.jpg'],
        ['BIGOLIVE','Bigo Live','https://www.workpointtoday.com/_next/image?url=https%3A%2F%2Fimages.workpointtoday.com%2Fworkpointnews%2F2020%2F05%2F20093429%2F1589942064_29126_web-logo1.webp&w=1920&q=75'],
        ['BLOODSTRK','Blood Strike','https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3199170/eeab00314314192f57bbdf91b91f8b871f890ce5/capsule_616x353.jpg?t=1748342194'],
        ['ASIASOFT','@CASH','https://www.csgame.store/storedata/category/LWugoAlt-a-cash.jpg'],
        ['ASIASOFT-F','@CASH (Flash Sale)','https://www.csgame.store/storedata/category/LWugoAlt-a-cash.jpg'],
        ['CTSIDE','Counter:Side','https://i.redd.it/counter-side-new-origin-event-update-is-now-live-v0-aqfjfmvx70ha1.jpg?width=800&format=pjpg&auto=webp&s=9d0d458025658ece34c04bc916636a27d5d4eb3b'],
        ['GRN-DTF','Delta Force (Garena)','https://img.tapimg.net/market/images/d3617c4d4d1caa7b7555013cf977da61.png'],
        ['DELTAFORCE','Delta Force (Steam)','https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2507950/192e49c1f0a1a2e1ec524fbbeb041af29de0a4e8/capsule_616x353.jpg?t=1766386644'],
        ['DIABLO-IMM','Diablo: Immortal','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwV_V33IEzC16SW83roWbYhW_wyXnUebhC9w&s'],
        ['DIABLO-IV','Diablo IV','https://image.api.playstation.com/vulcan/ap/rnd/202211/3017/Oo1B84A7BLCT157YFSxjtwG0.png'],
        ['DRAGONN-MC','Dragon Nest M: Classic','https://www.mustplay.in.th/static/thumb/2025/6/24/attach-1753335576777.jpg'],
        ['DRAGONRAJA','Dragon Raja','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbqSQu8pRjSvw6pxCx0lirnXQg6AgnPBcgeQ&s'],
        ['DUNKCITY','Dunk City Dynasty','https://play-lh.googleusercontent.com/G3ceO2fyX183uOvpGBChMz5kKjY7G358SGvxjij-9Kmk_fCHTERgwqIC2Yxn1TLXtNo'],
        ['EOSRED','EOS RED','https://play-lh.googleusercontent.com/Y288R6UHNNioArub4c2sz3iK3glXkTRkMTibFI3GtzRuCIeFZNlE3D7Mw-w4D0AXlEE'],
        ['EX','EX Cash','https://content.richmanshop.com/wp-content/uploads/2025/12/090749-%E0%B8%9A%E0%B8%B1%E0%B8%95%E0%B8%A3EX.png'],
        ['FREEFIRE','Free Fire','https://kingofgamersclub.com/storage/news/covers/148-cover.jpg'],
        ['GAMEINDY','GameIndy','https://play-lh.googleusercontent.com/gOUNz2Ldwq_QvTSv5-qlDvu32sgySfTDATjpwO24dK9W3HGBVRV8zAMPtzsruvr2Frri=w600-h300-pc0xffffff-pd'],
        ['UNDAWN','Garena Undawn','https://cdn.garenanow.com/webth/cdn/undawn/202111_official/mb/app_icon.png'],
        ['GEFORCENOW','GeForce NOW (ประเทศไทย)','https://www.blognone.com/sites/default/files/topics-images/gf-now.png'],
        ['GFNOW-SG','GeForce NOW (Singapore)','https://cdn.wegame.tech/default-cashcard-webp/geforce-now-(singapore).webp'],
        ['GENSHIN','Genshin Impact','https://cdn1.epicgames.com/spt-assets/99dc46c68ea14324964a856d18dcac5b/genshin-impact-xuaxa.jpg'],
        ['NIKKE','GODDESS OF VICTORY: NIKKE','https://sm.ign.com/t/ign_fr/cover/g/goddess-of/goddess-of-victory-nikke_nkm2.600.jpg'],
        ['HAIKYUFH','HAIKYU!! FLY HIGH','https://dl-hiq.garena.com/web/preregister/th/pc/mainbg.jpg'],
        ['HARRYPAWK','Harry Potter: Magic Awakened','https://play-lh.googleusercontent.com/BHVmFcqQxNPr1ubBpPXm_eCH-bioJRO7J700CYvtT21eZApx04QQx7vAyXHuE0hKzhzwsCxvKo9YgJRbVzBHRA'],
        ['HEARTOPIA','Heartopia','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRav0tRbrEOGGm3OaqjBHoAI3Yaxzn1gd4-hw&s'],
        ['HOKINGS','Honor of Kings','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZX-PAW6QkqYdp7trccXwVR1ajzX8Vm0U2CQ&s'],
        ['IDENTITYV','Identity V','https://play-lh.googleusercontent.com/8-SniYIRaeki791FyNlRggRuIjlxBpYM9k6F7q1UL75FW7IEUSWridDbrXmX5DkTokRq'],
        ['LOL','League of Legends','https://cdn1.epicgames.com/offer/24b9b5e323bc40eea252a10cdd3b2f10/EGS_LeagueofLegends_RiotGames_S1_2560x1440-47eb328eac5ddd63ebd096ded7d0d5ab'],
        ['WILDRIFT','League of Legends: Wild Rift','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPyVCHfZBp9NukaMfx2Qa0Iqf464NxnS_-1w&s'],
        ['LOR','Legends of Runeterra','https://cdn1.epicgames.com/offer/4fb89e9f47fe48258314c366649c398e/EGS_LegendsofRuneterra_RiotGames_S1_2560x1440-53b4135a798b686f67f2a95de625858f'],
        ['LDSPACE','Love and Deepspace','https://play-lh.googleusercontent.com/2cqFDGrjdmP425_o2a98siF7iUYkXMYhwR1ca94a_0v9Iw_hpe8t26DzaFICvYgecQc'],
        ['MAGICCHESS','Magic Chess: Go Go','https://cdn-bgp.bluestacks.com/BGP/us/gametiles_com.mobilechess.gp.jpg'],
        ['MPS-RE','MapleStory R: Evolution','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9SHP5ocNaNUOAehcZ5N9mw0U6F1uCEsL3Yw&s'],
        ['MARVELSNAP','MARVEL SNAP','https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1997040/capsule_616x353.jpg?t=1743019547'],
        ['METALSLUG','Metal Slug: Awakening','https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2963870/capsule_616x353.jpg?t=1737939922'],
        ['MLBB','Mobile Legends: Bang Bang','https://kaleoz-media.seagmcdn.com/kaleoz-store/202508/oss-6bd59c7215e1047c83deefb629186c94.png?x-oss-process=image/format,webp'],
        ['MUAA','MU Archangel','https://s.isanook.com/ga/0/ud/212/1063489/mu-1.jpg'],
        ['MU3-M','MU Origin 3','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBfiZcCs4KFlmqxvepqF13xGJqwKyQjSAi3w&s'],
        ['OVERWATCH2','Overwatch 2','https://mpics-cdn.mgronline.com/pics/Images/565000005678301.JPEG'],
        ['PSN','PlayStation Store','https://gmedia.playstation.com/is/image/SIEPDC/ps-store-listing-thumb-01-en-05nov20?$facebook$'],
        ['PUBGM-RAZER','PUBG Mobile (UC STATION)','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrknFKEIwPP-RbVEAZmCKeJFZ4en18R24l9w&s'],
        ['PUBGM','PUBG Mobile (Global)','https://esportsinsider.com/wp-content/uploads/2023/01/pubg-mobile-global-championship-viewership.jpg'],
        ['RO-M-CSC','Ragnarok M: Classic','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYAirjPcogpnavYcoNN0FCAsFdIQVSbsqwgA&s'],
        ['RO-M','Ragnarok M: Eternal Love','https://www.mustplay.in.th/static/thumb/2018/9/30/attach-1540876287062.jpg'],
        ['ROO','Ragnarok Original','https://play-lh.googleusercontent.com/IFPbKbY13tK8M3-cSaZeFZrFlJ1zSO85z4b7zP50NvipOk1IYx91TLcuZh958ulAjMQd=w750'],
        ['ROX','Ragnarok X: Next Generation','https://play-lh.googleusercontent.com/ploZ5a-s3_jIA4zi-9oICMasgnmKevk_8_GpO_bK2X4g9ejrmJi7GGezdfn06uBYwTnaPdWs3RMWpvOaUqygYA'],
        ['MOL','Razer Gold','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7y0V5h0idFszTTIZRPd3qjT2Fxc1tkYD_eg&s'],
        ['ROBLOX','Roblox Gift Card','https://pic.bittopup.com/apiUpload/abe57817ffa1af2bb19cfef4d9b4917b.png'],
        ['ROV-M','RoV Mobile','https://play-lh.googleusercontent.com/fWAs7pgAaEwNk5gGF0sOsdO-dKUmxm94wEeGbXEF7fsmcnEOTqqkJtqvFEDwk3w_F3wiFDlr9-eX5DtLK1GJCw'],
        ['SAUSAGE','Sausage Man','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvclzFVaMQOuVxHVGaonrL3PJ-YciK4uhTyg&s'],
        ['SEAL-M','Seal M','https://play-lh.googleusercontent.com/A909JQbxMxmjCoWX7ykm8vPu46FvnTSN_o8mA-khVsG3HIbfNtxC7UJbAkoz--tXal4'],
        ['SKRE','Seven Knights Re:BIRTH','https://sgimage.netmarble.com/images/netmarble/tskgb/20250916/nave1758009046995.jpg'],
        ['STARBUCKS','Starbucks e-Coupon','https://www.krungsri.com/getmedia/00cd4fcd-3146-4b0b-92a0-ea8bbd175f7d/starbucks-gift-card.jpg.aspx?resizemode=1'],
        ['STEAM','Steam Wallet Code','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmZsfKcDpY1gbovHCecpyRl-ORlm_ldierxA&s'],
        ['SUPERSUS','Super Sus','https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2920270/capsule_616x353.jpg?t=1725626076'],
        ['SWOJTC','Sword of Justice','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2782500/1747b6c7ee067fa2e70a1e3b45fc9712364b3681/header.jpg?t=1763116370'],
        ['VALORANT-D','Valorant','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQhbzaozI9HwUzU4ngAqR5Pekn99oTd6knKA&s'],
        ['WWM','Where Winds Meet','https://cdn1.epicgames.com/spt-assets/a55e4c8b015d445195aab2f028deace6/where-winds-meet-goctg.jpg'],
        ['WHITEOUTSV','Whiteout Survival','https://cdn-www.bluestacks.com/bs-images/227d4335274e46f4a63a87ab46d12ec61742970383.webp'],
        ['WUWAVEST','Wuthering Waves','https://cdn2.unrealengine.com/wuthering-waves-zhezhi-1200x675-25f8158bf918.jpg'],
        ['XHERO','X-HERO','https://kaleoz-media.seagmcdn.com/kaleoz-store/202502/oss-da14791da08cbb0dbfead27bc5e82baa.jpg'],
        ['ZZZERO','Zenless Zone Zero','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqDjtfEUkNy4IMHJA7kWThA8G4EcCaIu8AuA&s'],
        ['ZEPETO','ZEPETO','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5yKvM7Cw1F1xo-ySLknOObSpUSsfvdT5rtQ&s'],
    ];

    const count = await db.execute("SELECT count(*) as c FROM game_settings");
    if (count.rows[0].c === 0) {
        for (const [company_id, custom_name, custom_image_url] of games) {
            await db.execute({
                sql: `INSERT OR IGNORE INTO game_settings (company_id, profit_percent, profit_fixed, is_active, custom_name, custom_image_url)
                      VALUES (?, 0, 0, 1, ?, ?)`,
                args: [company_id, custom_name, custom_image_url]
            });
        }
        console.log(`🎮 Seeded ${games.length} games into game_settings`);
    }

    console.log("✅ All database tables ready");
};

module.exports = { initAllTables };
