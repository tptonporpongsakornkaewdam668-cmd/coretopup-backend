PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

DROP TABLE IF EXISTS users;
CREATE TABLE users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                balance DECIMAL(15,2) DEFAULT 0.00,
                points INTEGER DEFAULT 0,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            , username TEXT, resetToken TEXT, resetTokenExpires DATETIME);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('657cf288-b973-4cb5-b9b4-de62a685ceb2', 'tptonporpongsakornkaewdam668@gmail.com', '$2a$12$5JThLXayIQNGjiIliLsB1ucoZEzzHMXprrlIf7c9E6mese13Tw67i', 988, 1000, 'user', '2026-03-19 18:58:29', '2026-03-27 17:08:31', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('a8b583f8-c7ec-4eb4-b17d-04caacfffbcf', 'admin@gametopup.com', '$2a$12$HqVMrUh4TcnySfHgta8D5eyYdL75J3Pxo47wwCpB3liyqq1Lw9eI6', 0, 0, 'user', '2026-03-19 23:15:00', '2026-03-19 23:15:00', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('b014e6bf-977c-4497-b765-9021927bf7af', 'pongskon058@gmail.com', '$2a$12$.e4eIfm5VGMFhtI9HPxQMeOguxItsHZpRxbJo5IzBRwX6vHC8b1uW', 0, 0, 'user', '2026-03-20 00:50:01', '2026-03-20 00:50:01', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('e4f3c632-c51e-41f7-af7d-3a9e1ed84269', 'kuyrei123@gmail.com', '$2a$12$QQipZFgn7V90yVy9LoXfeuccZK.Fef.V8fJBUnVt1SqPYjh3sAEoS', 0, 0, 'user', '2026-03-20 12:54:40', '2026-03-20 12:54:40', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('e37021c9-16f1-4bb4-8c78-cd01cd8049ce', 'asdas@gg.gg', '$2a$12$Vj2Cwl0JDJaCBHOcDY1Q1OZwYe3c2HAm77DNtIypHThHcDSxgvhV.', 0, 0, 'user', '2026-03-20 14:35:29', '2026-03-20 14:35:29', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('5aa57dd5-5fe0-436c-b9cd-d87b3147dad4', 'webkakkak123@gmail.com', '$2a$12$QjpxaFp.86TFV5Pqd815j.Jz2wODGL2N5.wRsQvOKrplnkf4JslM6', 0, 0, 'user', '2026-03-20 21:29:45', '2026-03-20 21:29:45', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('dc3d72db-d6e5-4ca8-abd0-74abfa6200dc', 'poomchai123@gmail.com', '$2a$12$FT9BC6CydV6UER1dosBOmeYa2Rr9vafihOey94W.qFIkW4.1D/4KK', 0, 0, 'user', '2026-03-22 00:33:24', '2026-03-22 00:33:24', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('ba343326-e3de-4810-b92a-438dff5f2640', 'thanajaroon7899@gmail.com', '$2a$12$6kfSN2UQu3xQ3V5EB4YvPuHVK3QUDlkFX29yw2lWZz6nhCzgktPAi', 0, 0, 'user', '2026-03-22 07:03:06', '2026-03-22 07:03:06', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('dbfbd692-3fd3-45ec-98e5-732e0b37f415', 'chiiyesser@gmail.com', '$2a$12$Ya.EgwcYxRJpXisGPimrVuM27okvcFxjGO4eomkeAdtJf7xNRtNf2', 0, 0, 'user', '2026-03-22 11:48:17', '2026-03-22 11:48:17', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('4ef53178-aebb-41df-be10-8b5829cf37d4', 'jsjsjd@gmail.com', '$2a$12$ILln9Ol6UtY7FugqzpI.tOatRwiXisTxhey80NUAvwB14ZrYsIoH2', 0, 0, 'user', '2026-03-22 15:57:49', '2026-03-22 15:57:49', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('29002624-6790-488f-9ab9-32e511e16920', 'aomkungth2@gmail.com', '$2a$12$05/rpoJ7zDMy71LPJLvGauK9suCIwOPIQEQR6tPQIY6XUYrTCySAG', 0, 0, 'user', '2026-03-23 14:50:33', '2026-03-23 14:50:33', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('343d66b3-8467-413f-8193-620d2619db6a', 'pong1198@gmail.com', '$2a$12$7Jv1ruDeYF5J2J9zMUBPpelUE2073RdAfSItfIN0pnAAaTABAeMH2', 0, 0, 'user', '2026-03-23 15:19:25', '2026-03-23 15:19:25', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('2572645c-36e6-4ddf-a35c-d5fa8e6d2c7e', 'tonpor@coinzonetopup.shop', '$2a$12$khMaGmwvZuNGujpA0VFOcuJfPnU9iGQoPA7hTUIveQDyyDuz5ogTa', 0, 0, 'admin', '2026-03-24 12:06:43', '2026-03-24 12:06:43', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('5bf0c62c-0c39-46b9-b906-93d9b469ab5c', 'asd@888.888', '$2a$12$5SX72ryU4YHfxwms0o1CLOSH9ljRfxD4CTkf7MMWLEWR5ddGJqlWi', 1, 1, 'user', '2026-03-24 12:07:09', '2026-03-24 13:07:19', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('99bbf09a-d086-4973-a4f2-43e591ff521e', 'foantom021@gmail.com', '$2a$12$9sX39pXF53R33AkBgYFD.unzBHVjUKjVgAhFiaTdW0PY.W.bLTYxi', 0, 0, 'user', '2026-03-25 19:34:06', '2026-03-25 19:34:17', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('d351956e-1980-423a-a318-6b78f289616e', 'okaoxi0509@gmail.com', '$2a$12$6gJxKST8USSkxdjxMMKpK.Zx9Otf2037BL5Mu.cIgeOUEIJivjyIq', 0, 0, 'user', '2026-03-27 17:37:23', '2026-03-27 17:37:23', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('1f826bc1-c6d9-4d58-80e0-1a921cda116d', 'dowua69@gmail.com', '$2a$12$jU1pwuAUn4WCqjRPfZbXvOl3rzhfkXnqbt6N1AhExLZmoaXqzCyKC', 0, 0, 'user', '2026-03-28 07:17:08', '2026-03-28 07:17:08', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('2c9a64d3-a3d2-4cfe-bb42-51d848d5aa25', 'sukitnbt@gmail.com', '$2a$12$VURr8ET8gjt674HuDLA5ouN62JeeTwKZoiaqCxb/IlrGpDnLEpaLO', 0, 0, 'user', '2026-03-28 12:51:02', '2026-03-28 12:51:02', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('8c446cba-eb1e-49df-957f-cb59b8ffff24', 'admin1@gametopup.com', '$2a$12$53Uyo3LJa1m.fm4iv6ySh.oauuyw20aqw04wMqJPeZ74tTQjLBi6C', 0, 0, 'user', '2026-03-29 09:55:50', '2026-03-29 09:55:50', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('b7a62d61-24f3-47c3-a909-6345637e32c1', 'wfefwefa@defsdfs.df', '$2a$12$9UVgB7Dq5lz0FtH1JuKmVePUvmbjOJZLJ0gTVF8pGmGsTrF8ozc4G', 0, 0, 'user', '2026-03-29 13:51:29', '2026-03-29 13:51:29', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('ad25c3ae-032b-46af-9b9a-447faab7e570', 'test@test.test', '$2a$12$NwOaDasTqsBS9e5TqLJ39.jamr/ETRK3wTGGTX66Nu3Q.WMnTnN5a', 71112, 0, 'user', '2026-03-29 14:06:20', '2026-03-29 14:48:34', NULL, NULL, NULL);
INSERT INTO users (id, email, password, balance, points, role, created_at, updated_at, username, resetToken, resetTokenExpires) VALUES ('af58aa10-dc8c-4918-8aa5-0d18f53c70cb', 'mmm29-1234@hotmail.com', '$2a$12$BZygpi.jMrgYpLH23LdtTen2gzBg4rSTnsxvdbpOKZM/rTlM0epM.', 0, 0, 'user', '2026-03-29 15:37:04', '2026-03-29 15:37:04', NULL, NULL, NULL);

DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
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
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP, user_email TEXT DEFAULT NULL, username TEXT DEFAULT NULL, game_name TEXT DEFAULT NULL, package_name TEXT DEFAULT NULL, price NUMERIC DEFAULT NULL, product_data TEXT DEFAULT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
INSERT INTO orders (id, user_id, product_id, product_name, player_id, server, amount, status, transaction_id, provider, created_at, user_email, username, game_name, package_name, price, product_data) VALUES ('be7406d1-a29e-4824-8e87-fa31d5f18826', '657cf288-b973-4cb5-b9b4-de62a685ceb2', 'ROV-M', 'wePAY Game', '394909693707378', '-', 5, 'failed', 'WEPAY_1773947469768_qmld9', 'wepay', '2026-03-19 19:11:11', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO orders (id, user_id, product_id, product_name, player_id, server, amount, status, transaction_id, provider, created_at, user_email, username, game_name, package_name, price, product_data) VALUES ('19357feb-2850-488e-bd1c-7c36bd181d26', '657cf288-b973-4cb5-b9b4-de62a685ceb2', 'ROV-M', 'wePAY Game', '394909693707378', '-', 5, 'failed', 'WEPAY_1773947947038_jdpoae', 'wepay', '2026-03-19 19:19:09', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO orders (id, user_id, product_id, product_name, player_id, server, amount, status, transaction_id, provider, created_at, user_email, username, game_name, package_name, price, product_data) VALUES ('5e2ef400-9190-4b6a-846d-b4ac8b769dd9', '657cf288-b973-4cb5-b9b4-de62a685ceb2', 'HEARTOPIA', 'wePAY Game', '852904750520471552 1egw5bkq', '-', 10, 'success', 'G3956666091WDARO', 'wepay', '2026-03-19 21:44:26', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO orders (id, user_id, product_id, product_name, player_id, server, amount, status, transaction_id, provider, created_at, user_email, username, game_name, package_name, price, product_data) VALUES ('c096a362-f8cc-4ae4-94b9-5ca04b836028', '657cf288-b973-4cb5-b9b4-de62a685ceb2', '73', 'TEST LINE OA', '-', '-', 1, 'success', 'APP_1773961927496_7tspx', 'peamsub', '2026-03-19 23:12:08', 'tptonporpongsakornkaewdam668@gmail.com', NULL, NULL, NULL, NULL, NULL);
INSERT INTO orders (id, user_id, product_id, product_name, player_id, server, amount, status, transaction_id, provider, created_at, user_email, username, game_name, package_name, price, product_data) VALUES ('f12653e1-8a52-41c7-8b47-5da4bdfebb6e', '657cf288-b973-4cb5-b9b4-de62a685ceb2', '72', 'API TEST', '-', '-', 0, 'success', 'APP_1773961957887_n9m5t', 'peamsub', '2026-03-19 23:12:38', 'tptonporpongsakornkaewdam668@gmail.com', NULL, NULL, NULL, NULL, NULL);
INSERT INTO orders (id, user_id, product_id, product_name, player_id, server, amount, status, transaction_id, provider, created_at, user_email, username, game_name, package_name, price, product_data) VALUES ('84faaab9-c842-47af-b7b5-83efecd460ed', '657cf288-b973-4cb5-b9b4-de62a685ceb2', '72', 'API TEST', '-', '-', 0, 'success', 'APP_1773963215531_lqyao', 'peamsub', '2026-03-19 23:33:36', 'tptonporpongsakornkaewdam668@gmail.com', NULL, NULL, NULL, NULL, '"ทดสอบสินค้า API"');
INSERT INTO orders (id, user_id, product_id, product_name, player_id, server, amount, status, transaction_id, provider, created_at, user_email, username, game_name, package_name, price, product_data) VALUES ('4ae68076-2ba9-4569-b234-40961eee6ba0', '99bbf09a-d086-4973-a4f2-43e591ff521e', '72', 'API TEST', '-', '-', 0, 'success', 'APP_1774467246899_xf10si', 'peamsub', '2026-03-25 19:34:17', 'foantom021@gmail.com', NULL, NULL, NULL, NULL, '"ทดสอบสินค้า API"');
INSERT INTO orders (id, user_id, product_id, product_name, player_id, server, amount, status, transaction_id, provider, created_at, user_email, username, game_name, package_name, price, product_data) VALUES ('46ba8c49-1f1b-48b6-b6ab-a47675b87f02', '657cf288-b973-4cb5-b9b4-de62a685ceb2', 'ROV-M', 'RoV Mobile', '3100634467468402', '-', 10, 'success', 'G4631311434QL0TQ', 'wepay', '2026-03-27 17:08:32', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO orders (id, user_id, product_id, product_name, player_id, server, amount, status, transaction_id, provider, created_at, user_email, username, game_name, package_name, price, product_data) VALUES ('bc616d3c-6e99-48f0-9206-7e19a5767fe2', 'ad25c3ae-032b-46af-9b9a-447faab7e570', '4', 'test product', '-', 'Redeem Shop', 8888, 'success', 'MQKXWAQGT1Y8QT1', 'redeem', '2026-03-29 14:48:35', NULL, NULL, NULL, NULL, NULL, '{"Redeem Code":"MQKXWAQGT1Y8QT1"}');

DROP TABLE IF EXISTS history;
CREATE TABLE history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                type TEXT, -- topup, purchase
                amount DECIMAL(10,2),
                description TEXT,
                status TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

DROP TABLE IF EXISTS game_settings;
CREATE TABLE game_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id TEXT UNIQUE,
                game_name TEXT,
                profit_percent DECIMAL(5,2) DEFAULT 0.00,
                profit_fixed DECIMAL(10,2) DEFAULT 0.00,
                is_active BOOLEAN DEFAULT 1
            , custom_name TEXT DEFAULT NULL, custom_image_url TEXT DEFAULT NULL);
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (1, 'ACERACER', NULL, 0, 0, 1, 'Ace Racer', 'https://play-lh.googleusercontent.com/tmTk1vNc6Nkl8wctgd_oXcp1Dl_xTYL4f1ECntGCmMNSQCfGUtvhSoNHCF9N9ATi8T4g');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (2, 'AFKJOURNEY', NULL, 0, 0, 1, 'AFK Journey', 'https://upload.wikimedia.org/wikipedia/en/9/99/AFK_Journey_app_icon.jpg');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (3, 'ARENABO', NULL, 0, 0, 1, 'Arena Breakout', 'https://www.game-ded.com/wordpress/wp-content/uploads/2024/04/ABI18.jpg');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (4, 'BIGOLIVE', NULL, 0, 0, 1, 'Bigo Live', 'https://www.workpointtoday.com/_next/image?url=https%3A%2F%2Fimages.workpointtoday.com%2Fworkpointnews%2F2020%2F05%2F20093429%2F1589942064_29126_web-logo1.webp&w=1920&q=75');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (5, 'BLOODSTRK', NULL, 0, 0, 1, 'Blood Strike', 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3199170/eeab00314314192f57bbdf91b91f8b871f890ce5/capsule_616x353.jpg?t=1748342194');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (6, 'ASIASOFT', NULL, 0, 0, 1, '@CASH', 'https://www.csgame.store/storedata/category/LWugoAlt-a-cash.jpg');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (7, 'ASIASOFT-F', NULL, 0, 0, 1, '@CASH (Flash Sale)', 'https://www.csgame.store/storedata/category/LWugoAlt-a-cash.jpg');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (8, 'CTSIDE', NULL, 0, 0, 1, 'Counter:Side', 'https://i.redd.it/counter-side-new-origin-event-update-is-now-live-v0-aqfjfmvx70ha1.jpg?width=800&format=pjpg&auto=webp&s=9d0d458025658ece34c04bc916636a27d5d4eb3b');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (9, 'GRN-DTF', NULL, 0, 0, 1, 'Delta Force (Garena)', 'https://img.tapimg.net/market/images/d3617c4d4d1caa7b7555013cf977da61.png?imageView2/0/h/270/format/jpg/interlace/1/ignore-error/1&t=1');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (10, 'DELTAFORCE', NULL, 0, 0, 1, 'Delta Force (Steam)', 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2507950/192e49c1f0a1a2e1ec524fbbeb041af29de0a4e8/capsule_616x353.jpg?t=1766386644');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (11, 'DIABLO-IMM', NULL, 0, 0, 1, 'Diablo: Immortal', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwV_V33IEzC16SW83roWbYhW_wyXnUebhC9w&s');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (12, 'DIABLO-IV', NULL, 0, 0, 1, 'Diablo IV', 'https://image.api.playstation.com/vulcan/ap/rnd/202211/3017/Oo1B84A7BLCT157YFSxjtwG0.png');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (13, 'DRAGONN-MC', NULL, 0, 0, 1, 'Dragon Nest M: Classic', 'https://www.mustplay.in.th/static/thumb/2025/6/24/attach-1753335576777.jpg');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (14, 'DRAGONRAJA', NULL, 0, 0, 1, 'Dragon Raja', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbqSQu8pRjSvw6pxCx0lirnXQg6AgnPBcgeQ&s');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (15, 'DUNKCITY', NULL, 0, 0, 1, 'Dunk City Dynasty', 'https://play-lh.googleusercontent.com/G3ceO2fyX183uOvpGBChMz5kKjY7G358SGvxjij-9Kmk_fCHTERgwqIC2Yxn1TLXtNo');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (16, 'EOSRED', NULL, 0, 0, 1, 'EOS RED', 'https://play-lh.googleusercontent.com/Y288R6UHNNioArub4c2sz3iK3glXkTRkMTibFI3GtzRuCIeFZNlE3D7Mw-w4D0AXlEE');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (17, 'EX', NULL, 0, 0, 1, 'EX Cash', 'https://content.richmanshop.com/wp-content/uploads/2025/12/090749-%E0%B8%9A%E0%B8%B1%E0%B8%95%E0%B8%A3EX.png');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (18, 'FREEFIRE', NULL, 0, 0, 1, 'Free Fire', 'https://kingofgamersclub.com/storage/news/covers/148-cover.jpg');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (19, 'GAMEINDY', NULL, 0, 0, 1, 'GameIndy', 'https://play-lh.googleusercontent.com/gOUNz2Ldwq_QvTSv5-qlDvu32sgySfTDATjpwO24dK9W3HGBVRV8zAMPtzsruvr2Frri=w600-h300-pc0xffffff-pd');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (20, 'UNDAWN', NULL, 0, 0, 1, 'Garena Undawn', 'https://cdn.garenanow.com/webth/cdn/undawn/202111_official/mb/app_icon.png');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (21, 'GEFORCENOW', NULL, 0, 0, 1, 'GeForce NOW (ประเทศไทย)', 'https://www.blognone.com/sites/default/files/topics-images/gf-now.png');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (22, 'GFNOW-SG', NULL, 0, 0, 1, 'GeForce NOW (Singapore)', 'https://cdn.wegame.tech/default-cashcard-webp/geforce-now-(singapore).webp');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (23, 'GENSHIN', NULL, 0, 0, 1, 'Genshin Impact', 'https://cdn1.epicgames.com/spt-assets/99dc46c68ea14324964a856d18dcac5b/genshin-impact-xuaxa.jpg');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (24, 'NIKKE', NULL, 0, 0, 1, 'GODDESS OF VICTORY: NIKKE', 'https://sm.ign.com/t/ign_fr/cover/g/goddess-of/goddess-of-victory-nikke_nkm2.600.jpg');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (25, 'HAIKYUFH', NULL, 0, 0, 1, 'HAIKYU!! FLY HIGH', 'https://dl-hiq.garena.com/web/preregister/th/pc/mainbg.jpg');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (26, 'HARRYPAWK', NULL, 0, 0, 1, 'Harry Potter: Magic Awakened', 'https://play-lh.googleusercontent.com/BHVmFcqQxNPr1ubBpPXm_eCH-bioJRO7J700CYvtT21eZApx04QQx7vAyXHuE0hKzhzwsCxvKo9YgJRbVzBHRA');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (27, 'HEARTOPIA', NULL, 0, 0, 1, 'Heartopia', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRav0tRbrEOGGm3OaqjBHoAI3Yaxzn1gd4-hw&s');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (28, 'HOKINGS', NULL, 0, 0, 1, 'Honor of Kings', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZX-PAW6QkqYdp7trccXwVR1ajzX8Vm0U2CQ&s');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (29, 'IDENTITYV', NULL, 0, 0, 1, 'Identity V', 'https://play-lh.googleusercontent.com/8-SniYIRaeki791FyNlRggRuIjlxBpYM9k6F7q1UL75FW7IEUSWridDbrXmX5DkTokRq');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (30, 'LOL', NULL, 0, 0, 1, 'League of Legends', 'https://cdn1.epicgames.com/offer/24b9b5e323bc40eea252a10cdd3b2f10/EGS_LeagueofLegends_RiotGames_S1_2560x1440-47eb328eac5ddd63ebd096ded7d0d5ab');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (31, 'WILDRIFT', NULL, 0, 0, 1, 'League of Legends: Wild Rift', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPyVCHfZBp9NukaMfx2Qa0Iqf464NxnS_-1w&s');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (32, 'LOR', NULL, 0, 0, 1, 'Legends of Runeterra', 'https://cdn1.epicgames.com/offer/4fb89e9f47fe48258314c366649c398e/EGS_LegendsofRuneterra_RiotGames_S1_2560x1440-53b4135a798b686f67f2a95de625858f');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (33, 'LDSPACE', NULL, 0, 0, 1, 'Love and Deepspace', 'https://play-lh.googleusercontent.com/2cqFDGrjdmP425_o2a98siF7iUYkXMYhwR1ca94a_0v9Iw_hpe8t26DzaFICvYgecQc');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (34, 'MAGICCHESS', NULL, 0, 0, 1, 'Magic Chess: Go Go', 'https://cdn-bgp.bluestacks.com/BGP/us/gametiles_com.mobilechess.gp.jpg');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (35, 'MPS-RE', NULL, 0, 0, 1, 'MapleStory R: Evolution', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9SHP5ocNaNUOAehcZ5N9mw0U6F1uCEsL3Yw&s');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (36, 'MARVELSNAP', NULL, 0, 0, 1, 'MARVEL SNAP', 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1997040/capsule_616x353.jpg?t=1743019547');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (37, 'METALSLUG', NULL, 0, 0, 1, 'Metal Slug: Awakening', 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2963870/capsule_616x353.jpg?t=1737939922');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (38, 'MLBB', NULL, 0, 0, 1, 'Mobile Legends: Bang Bang', 'https://kaleoz-media.seagmcdn.com/kaleoz-store/202508/oss-6bd59c7215e1047c83deefb629186c94.png?x-oss-process=image/format,webp');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (39, 'MUAA', NULL, 0, 0, 1, 'MU Archangel', 'https://s.isanook.com/ga/0/ud/212/1063489/mu-1.jpg?ip/crop/w1200h700/q80/jpg');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (40, 'MU3-M', NULL, 0, 0, 1, 'MU Origin 3', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBfiZcCs4KFlmqxvepqF13xGJqwKyQjSAi3w&s');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (41, 'OVERWATCH2', NULL, 0, 0, 1, 'Overwatch 2', 'https://mpics-cdn.mgronline.com/pics/Images/565000005678301.JPEG');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (42, 'PSN', NULL, 0, 0, 1, 'PlayStation Store', 'https://gmedia.playstation.com/is/image/SIEPDC/ps-store-listing-thumb-01-en-05nov20?$facebook$');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (43, 'PUBGM-RAZER', NULL, 0, 0, 1, 'PUBG Mobile (UC STATION)', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrknFKEIwPP-RbVEAZmCKeJFZ4en18R24l9w&s');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (44, 'PUBGM', NULL, 0, 0, 1, 'PUBG Mobile (Global)', 'https://esportsinsider.com/wp-content/uploads/2023/01/pubg-mobile-global-championship-viewership.jpg');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (45, 'RO-M-CSC', NULL, 0, 0, 1, 'Ragnarok M: Classic', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYAirjPcogpnavYcoNN0FCAsFdIQVSbsqwgA&s');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (46, 'RO-M', NULL, 0, 0, 1, 'Ragnarok M: Eternal Love', 'https://www.mustplay.in.th/static/thumb/2018/9/30/attach-1540876287062.jpg');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (47, 'ROO', NULL, 0, 0, 1, 'Ragnarok Original', 'https://play-lh.googleusercontent.com/IFPbKbY13tK8M3-cSaZeFZrFlJ1zSO85z4b7zP50NvipOk1IYx91TLcuZh958ulAjMQd=w750');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (48, 'ROX', NULL, 0, 0, 1, 'Ragnarok X: Next Generation', 'https://play-lh.googleusercontent.com/ploZ5a-s3_jIA4zi-9oICMasgnmKevk_8_GpO_bK2X4g9ejrmJi7GGezdfn06uBYwTnaPdWs3RMWpvOaUqygYA');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (49, 'MOL', NULL, 0, 0, 1, 'Razer Gold', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7y0V5h0idFszTTIZRPd3qjT2Fxc1tkYD_eg&s');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (50, 'ROBLOX', NULL, 0, 0, 1, 'Roblox Gift Card', 'https://pic.bittopup.com/apiUpload/abe57817ffa1af2bb19cfef4d9b4917b.png');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (51, 'ROV-M', NULL, 0, 0, 1, 'RoV Mobile', 'https://play-lh.googleusercontent.com/fWAs7pgAaEwNk5gGF0sOsdO-dKUmxm94wEeGbXEF7fsmcnEOTqqkJtqvFEDwk3w_F3wiFDlr9-eX5DtLK1GJCw');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (52, 'SAUSAGE', NULL, 0, 0, 1, 'Sausage Man', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvclzFVaMQOuVxHVGaonrL3PJ-YciK4uhTyg&s');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (53, 'SEAL-M', NULL, 0, 0, 1, 'Seal M', 'https://play-lh.googleusercontent.com/A909JQbxMxmjCoWX7ykm8vPu46FvnTSN_o8mA-khVsG3HIbfNtxC7UJbAkoz--tXal4');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (54, 'SKRE', NULL, 0, 0, 1, 'Seven Knights Re:BIRTH', 'https://sgimage.netmarble.com/images/netmarble/tskgb/20250916/nave1758009046995.jpg');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (55, 'STARBUCKS', NULL, 0, 0, 1, 'Starbucks e-Coupon', 'https://www.krungsri.com/getmedia/00cd4fcd-3146-4b0b-92a0-ea8bbd175f7d/starbucks-gift-card.jpg.aspx?resizemode=1');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (56, 'STEAM', NULL, 0, 0, 1, 'Steam Wallet Code', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmZsfKcDpY1gbovHCecpyRl-ORlm_ldierxA&s');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (57, 'SUPERSUS', NULL, 0, 0, 1, 'Super Sus', 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2920270/capsule_616x353.jpg?t=1725626076');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (58, 'SWOJTC', NULL, 0, 0, 1, 'Sword of Justice', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2782500/1747b6c7ee067fa2e70a1e3b45fc9712364b3681/header.jpg?t=1763116370');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (59, 'VALORANT-D', NULL, 0, 0, 1, 'Valorant', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQhbzaozI9HwUzU4ngAqR5Pekn99oTd6knKA&s');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (60, 'WWM', NULL, 0, 0, 1, 'Where Winds Meet', 'https://cdn1.epicgames.com/spt-assets/a55e4c8b015d445195aab2f028deace6/where-winds-meet-goctg.jpg?resize=1&w=480&h=270&quality=medium');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (61, 'WHITEOUTSV', NULL, 0, 0, 1, 'Whiteout Survival', 'https://cdn-www.bluestacks.com/bs-images/227d4335274e46f4a63a87ab46d12ec61742970383.webp');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (62, 'WUWAVEST', NULL, 0, 0, 1, 'Wuthering Waves', 'https://cdn2.unrealengine.com/wuthering-waves-zhezhi-1200x675-25f8158bf918.jpg');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (63, 'XHERO', NULL, 0, 0, 1, 'X-HERO', 'https://kaleoz-media.seagmcdn.com/kaleoz-store/202502/oss-da14791da08cbb0dbfead27bc5e82baa.jpg');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (64, 'ZZZERO', NULL, 0, 0, 1, 'Zenless Zone Zero', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqDjtfEUkNy4IMHJA7kWThA8G4EcCaIu8AuA&s');
INSERT INTO game_settings (id, company_id, game_name, profit_percent, profit_fixed, is_active, custom_name, custom_image_url) VALUES (65, 'ZEPETO', NULL, 0, 0, 1, 'ZEPETO', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5yKvM7Cw1F1xo-ySLknOObSpUSsfvdT5rtQ&s');

DROP TABLE IF EXISTS product_overrides;
CREATE TABLE product_overrides (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id TEXT, original_price DECIMAL, selling_price DECIMAL, discount_price DECIMAL, discount_start DATETIME, discount_end DATETIME, cost_price DECIMAL, custom_image_url TEXT DEFAULT NULL);
INSERT INTO product_overrides (id, company_id, original_price, selling_price, discount_price, discount_start, discount_end, cost_price, custom_image_url) VALUES (2, 'FREEFIRE', 90.02, 90, NULL, NULL, NULL, NULL, NULL);
INSERT INTO product_overrides (id, company_id, original_price, selling_price, discount_price, discount_start, discount_end, cost_price, custom_image_url) VALUES (3, 'FREEFIRE', 33.31, 33, NULL, NULL, NULL, NULL, NULL);
INSERT INTO product_overrides (id, company_id, original_price, selling_price, discount_price, discount_start, discount_end, cost_price, custom_image_url) VALUES (4, 'RAINBOW6', 25.01, 25.01, NULL, NULL, NULL, NULL, 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/72GjUQubvkm7i7afhmsEXd/d665213a90b3aef5f0e59458e3a78468/r6m_pagemeta_logo_nov24.jpg');
INSERT INTO product_overrides (id, company_id, original_price, selling_price, discount_price, discount_start, discount_end, cost_price, custom_image_url) VALUES (5, 'MARVEL-RV', 37, 37, NULL, NULL, NULL, NULL, 'https://cdn1.epicgames.com/spt-assets/eb15454c010f4a748498cd3a62096a52/marvel-rivals-wq3mr.png');
INSERT INTO product_overrides (id, company_id, original_price, selling_price, discount_price, discount_start, discount_end, cost_price, custom_image_url) VALUES (6, 'COD-M', 20, 20, NULL, NULL, NULL, NULL, 'https://i.redd.it/zlg7bbp362sd1.jpeg');
INSERT INTO product_overrides (id, company_id, original_price, selling_price, discount_price, discount_start, discount_end, cost_price, custom_image_url) VALUES (7, 'HONKAISR', 179.01, 179.01, NULL, NULL, NULL, NULL, 'https://i.ytimg.com/vi/HqQqHgt4frU/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCNrQYNx2mC5qYU86uW9NIUShuCdg');
INSERT INTO product_overrides (id, company_id, original_price, selling_price, discount_price, discount_start, discount_end, cost_price, custom_image_url) VALUES (8, 'FIFA-M', 15, 15, NULL, NULL, NULL, NULL, 'https://play-lh.googleusercontent.com/yQHb1bk88ENXLZ2_ZO-st7cuG78pva5yRAge2CjhBPoBoEng1ouxyx30vK4s4Z7553Kohd9pPVm1GC2Phs8slA');
INSERT INTO product_overrides (id, company_id, original_price, selling_price, discount_price, discount_start, discount_end, cost_price, custom_image_url) VALUES (9, 'TFTACTICS', 130, 130, NULL, NULL, NULL, NULL, 'https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/0ad176a172ea82471182d15134fd606bc814d9b8-1920x1080.jpg?accountingTag=TFT');
INSERT INTO product_overrides (id, company_id, original_price, selling_price, discount_price, discount_start, discount_end, cost_price, custom_image_url) VALUES (10, 'G78NAGB', 30, 30, NULL, NULL, NULL, NULL, 'https://cdn.aptoide.com/imgs/c/1/8/c182ffe28bc73ec111cab2b135233956_fgraphic.jpg');
INSERT INTO product_overrides (id, company_id, original_price, selling_price, discount_price, discount_start, discount_end, cost_price, custom_image_url) VALUES (12, '1', 12, 14, NULL, NULL, NULL, NULL, 'https://img.rdcw.co.th/images/ab8fd0a1ede229f325b3b7b0c75532a675fe9edef8029595fa0b9d0bb8eedfa9.png');

DROP TABLE IF EXISTS system_settings;
CREATE TABLE system_settings (key TEXT PRIMARY KEY, value TEXT);
INSERT INTO system_settings (key, value) VALUES ('point_earn_threshold', '30');
INSERT INTO system_settings (key, value) VALUES ('point_earn_rate', '1');
INSERT INTO system_settings (key, value) VALUES ('point_redeem_rate', '0.01');

DROP TABLE IF EXISTS discount_codes;
CREATE TABLE discount_codes (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE, type TEXT, value DECIMAL, min_order_amount DECIMAL, max_discount DECIMAL, usage_limit INTEGER, usage_count INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT 1, end_date DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, title TEXT, description TEXT, image_url TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
INSERT INTO discount_codes (id, code, type, value, min_order_amount, max_discount, usage_limit, usage_count, is_active, end_date, created_at, title, description, image_url, updated_at) VALUES (1, 'SONGKRAN69', 'percent', 2, NULL, NULL, NULL, 0, 1, NULL, '2026-03-19 23:08:05', NULL, NULL, NULL, '2026-03-19 23:08:05');

DROP TABLE IF EXISTS sliders;
CREATE TABLE sliders (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            image_url TEXT, 
            link_url TEXT, 
            order_index INTEGER DEFAULT 0, 
            is_active INTEGER DEFAULT 1, 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
INSERT INTO sliders (id, image_url, link_url, order_index, is_active, created_at) VALUES (5, 'https://www.coinzonetopup.shop/slidebar/2.png', NULL, 2, 1, '2026-03-19 19:06:34');
INSERT INTO sliders (id, image_url, link_url, order_index, is_active, created_at) VALUES (7, 'https://img2.pic.in.th/Bronze750b29f375d0da40.png', '', 0, 1, '2026-03-29 14:38:01');

DROP TABLE IF EXISTS topups;
CREATE TABLE topups (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            user_id TEXT, 
            amount DECIMAL, 
            trans_ref TEXT UNIQUE, 
            sender_name TEXT, 
            sender_bank TEXT, 
            status TEXT, 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
INSERT INTO topups (id, user_id, amount, trans_ref, sender_name, sender_bank, status, created_at) VALUES (1, '657cf288-b973-4cb5-b9b4-de62a685ceb2', 1, '0460835o8lnur006D3wv', 'MR. PHONGSAKON K', 'ธนาคารกสิกรไทย', 'success', '2026-03-24 12:28:51');

DROP TABLE IF EXISTS fivem_packages;
CREATE TABLE fivem_packages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            image_url TEXT,
            fivem_amount INTEGER NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

DROP TABLE IF EXISTS fivem_keys;
CREATE TABLE fivem_keys (
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
        );

DROP TABLE IF EXISTS redeem_codes;
CREATE TABLE redeem_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL UNIQUE,
                item_id TEXT NOT NULL,
                amount INTEGER NOT NULL DEFAULT 1,
                status TEXT NOT NULL DEFAULT 'unused', -- 'unused', 'used'
                expire_date DATETIME,
                used_by TEXT, -- player_id
                used_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            , order_id TEXT);
INSERT INTO redeem_codes (id, code, item_id, amount, status, expire_date, used_by, used_at, created_at, order_id) VALUES (3, 'WELCOME2026', 'coin', 1000, 'revoked', '2026-12-31 23:59:59', NULL, NULL, '2026-03-29 09:48:20', NULL);
INSERT INTO redeem_codes (id, code, item_id, amount, status, expire_date, used_by, used_at, created_at, order_id) VALUES (4, 'DMBDX0EBN10S1TX', 'ldfks;ldkf', 8, 'used', '2026-04-28T14:14:50.189Z', 'UID-9999', '2026-03-29 14:30:57', '2026-03-29 14:14:50', 'ORD-1774793690050-4XS6');
INSERT INTO redeem_codes (id, code, item_id, amount, status, expire_date, used_by, used_at, created_at, order_id) VALUES (5, 'MQKXWAQGT1Y8QT1', 'ldfks;ldkf', 8, 'unused', '2026-04-28T14:48:35.055Z', NULL, NULL, '2026-03-29 14:48:35', 'ORD-1774795714902-HEQ7');

DROP TABLE IF EXISTS redeem_logs;
CREATE TABLE redeem_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id TEXT NOT NULL,
                code TEXT NOT NULL,
                status TEXT NOT NULL, -- 'success', 'invalid', 'used', 'expired', 'already_redeemed_by_player'
                ip TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
INSERT INTO redeem_logs (id, player_id, code, status, ip, user_agent, created_at) VALUES (1, 'UID-9999', 'DMBDX0EBN10S1TX', 'success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-29 14:30:58');
INSERT INTO redeem_logs (id, player_id, code, status, ip, user_agent, created_at) VALUES (2, 'UID-9999', 'DMBDX0EBN10S1TX', 'used', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-29 14:31:10');
INSERT INTO redeem_logs (id, player_id, code, status, ip, user_agent, created_at) VALUES (3, 'UID-9999', 'DMBDX0EBN10S1T', 'invalid', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-29 14:31:16');

DROP TABLE IF EXISTS api_keys;
CREATE TABLE api_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT, -- Fixed for libsql
                name TEXT NOT NULL,
                key TEXT UNIQUE NOT NULL,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used_at DATETIME
            );
INSERT INTO api_keys (id, name, key, status, created_at, last_used_at) VALUES (2, 'หดแกปห', 'CZ-RD-CE58-FDLU', 'active', '2026-03-29 09:05:54', NULL);
INSERT INTO api_keys (id, name, key, status, created_at, last_used_at) VALUES (3, 'test', 'rsk_90bc42c79d60eaa3b0eb8efac930b34ef029130bfe88b01f', 'active', '2026-03-29 14:30:39', '2026-03-29 14:31:15');

DROP TABLE IF EXISTS redeem_products;
CREATE TABLE redeem_products (
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
            );
INSERT INTO redeem_products (id, name, description, price, item_id, amount, image_url, is_active, created_at, updated_at) VALUES (4, 'test product', 'kjv;dkflsdfk;lsdkf;lk;sdfk;lsf', 8888, 'ldfks;ldkf', 8, 'https://img2.pic.in.th/Bronze750b29f375d0da40.png', 1, '2026-03-29 14:05:27', '2026-03-29 14:10:47');

DROP TABLE IF EXISTS redeem_orders;
CREATE TABLE redeem_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT NOT NULL UNIQUE,
                player_id TEXT NOT NULL,
                product_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
INSERT INTO redeem_orders (id, order_id, player_id, product_id, status, created_at, updated_at) VALUES (1, 'ORD-1774793690050-4XS6', 'ad25c3ae-032b-46af-9b9a-447faab7e570', 4, 'paid', '2026-03-29 14:14:50', '2026-03-29 14:14:50');
INSERT INTO redeem_orders (id, order_id, player_id, product_id, status, created_at, updated_at) VALUES (2, 'ORD-1774795714902-HEQ7', 'ad25c3ae-032b-46af-9b9a-447faab7e570', 4, 'paid', '2026-03-29 14:48:34', '2026-03-29 14:48:34');

COMMIT;