const { createClient } = require('@libsql/client');

const db = createClient({
    url: 'libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw'
});

const gameImages = [
    { company_id: 'ACERACER',    name: 'Ace Racer',                               img: 'https://play-lh.googleusercontent.com/tmTk1vNc6Nkl8wctgd_oXcp1Dl_xTYL4f1ECntGCmMNSQCfGUtvhSoNHCF9N9ATi8T4g' },
    { company_id: 'AFKJOURNEY',  name: 'AFK Journey',                             img: 'https://upload.wikimedia.org/wikipedia/en/9/99/AFK_Journey_app_icon.jpg' },
    { company_id: 'ARENABO',     name: 'Arena Breakout',                          img: 'https://www.game-ded.com/wordpress/wp-content/uploads/2024/04/ABI18.jpg' },
    { company_id: 'BIGOLIVE',    name: 'Bigo Live',                               img: 'https://www.workpointtoday.com/_next/image?url=https%3A%2F%2Fimages.workpointtoday.com%2Fworkpointnews%2F2020%2F05%2F20093429%2F1589942064_29126_web-logo1.webp&w=1920&q=75' },
    { company_id: 'BLOODSTRK',   name: 'Blood Strike',                            img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3199170/eeab00314314192f57bbdf91b91f8b871f890ce5/capsule_616x353.jpg?t=1748342194' },
    { company_id: 'ASIASOFT',    name: '@CASH',                                   img: 'https://www.csgame.store/storedata/category/LWugoAlt-a-cash.jpg' },
    { company_id: 'ASIASOFT-F',  name: '@CASH (Flash Sale)',                     img: 'https://www.csgame.store/storedata/category/LWugoAlt-a-cash.jpg' },
    { company_id: 'CTSIDE',      name: 'Counter:Side',                            img: 'https://i.redd.it/counter-side-new-origin-event-update-is-now-live-v0-aqfjfmvx70ha1.jpg?width=800&format=pjpg&auto=webp&s=9d0d458025658ece34c04bc916636a27d5d4eb3b' },
    { company_id: 'GRN-DTF',     name: 'Delta Force (Garena)',                    img: 'https://img.tapimg.net/market/images/d3617c4d4d1caa7b7555013cf977da61.png?imageView2/0/h/270/format/jpg/interlace/1/ignore-error/1&t=1' },
    { company_id: 'DELTAFORCE',  name: 'Delta Force (Steam)',                     img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2507950/192e49c1f0a1a2e1ec524fbbeb041af29de0a4e8/capsule_616x353.jpg?t=1766386644' },
    { company_id: 'DIABLO-IMM',  name: 'Diablo: Immortal',                       img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwV_V33IEzC16SW83roWbYhW_wyXnUebhC9w&s' },
    { company_id: 'DIABLO-IV',   name: 'Diablo IV',                               img: 'https://image.api.playstation.com/vulcan/ap/rnd/202211/3017/Oo1B84A7BLCT157YFSxjtwG0.png' },
    { company_id: 'DRAGONN-MC',  name: 'Dragon Nest M: Classic',                 img: 'https://www.mustplay.in.th/static/thumb/2025/6/24/attach-1753335576777.jpg' },
    { company_id: 'DRAGONRAJA',  name: 'Dragon Raja',                             img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbqSQu8pRjSvw6pxCx0lirnXQg6AgnPBcgeQ&s' },
    { company_id: 'DUNKCITY',    name: 'Dunk City Dynasty',                       img: 'https://play-lh.googleusercontent.com/G3ceO2fyX183uOvpGBChMz5kKjY7G358SGvxjij-9Kmk_fCHTERgwqIC2Yxn1TLXtNo' },
    { company_id: 'EOSRED',      name: 'EOS RED',                                 img: 'https://play-lh.googleusercontent.com/Y288R6UHNNioArub4c2sz3iK3glXkTRkMTibFI3GtzRuCIeFZNlE3D7Mw-w4D0AXlEE' },
    { company_id: 'EX',          name: 'EX Cash',                                 img: 'https://content.richmanshop.com/wp-content/uploads/2025/12/090749-%E0%B8%9A%E0%B8%B1%E0%B8%95%E0%B8%A3EX.png' },
    { company_id: 'FREEFIRE',    name: 'Free Fire',                               img: 'https://kingofgamersclub.com/storage/news/covers/148-cover.jpg' },
    { company_id: 'GAMEINDY',    name: 'GameIndy',                                img: 'https://play-lh.googleusercontent.com/gOUNz2Ldwq_QvTSv5-qlDvu32sgySfTDATjpwO24dK9W3HGBVRV8zAMPtzsruvr2Frri=w600-h300-pc0xffffff-pd' },
    { company_id: 'UNDAWN',      name: 'Garena Undawn',                           img: 'https://cdn.garenanow.com/webth/cdn/undawn/202111_official/mb/app_icon.png' },
    { company_id: 'GEFORCENOW',  name: 'GeForce NOW (ประเทศไทย)',               img: 'https://www.blognone.com/sites/default/files/topics-images/gf-now.png' },
    { company_id: 'GFNOW-SG',   name: 'GeForce NOW (Singapore)',                 img: 'https://cdn.wegame.tech/default-cashcard-webp/geforce-now-(singapore).webp' },
    { company_id: 'GENSHIN',     name: 'Genshin Impact',                          img: 'https://cdn1.epicgames.com/spt-assets/99dc46c68ea14324964a856d18dcac5b/genshin-impact-xuaxa.jpg' },
    { company_id: 'NIKKE',       name: 'GODDESS OF VICTORY: NIKKE',              img: 'https://sm.ign.com/t/ign_fr/cover/g/goddess-of/goddess-of-victory-nikke_nkm2.600.jpg' },
    { company_id: 'HAIKYUFH',   name: 'HAIKYU!! FLY HIGH',                       img: 'https://dl-hiq.garena.com/web/preregister/th/pc/mainbg.jpg' },
    { company_id: 'HARRYPAWK',   name: 'Harry Potter: Magic Awakened',            img: 'https://play-lh.googleusercontent.com/BHVmFcqQxNPr1ubBpPXm_eCH-bioJRO7J700CYvtT21eZApx04QQx7vAyXHuE0hKzhzwsCxvKo9YgJRbVzBHRA' },
    { company_id: 'HEARTOPIA',   name: 'Heartopia',                               img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRav0tRbrEOGGm3OaqjBHoAI3Yaxzn1gd4-hw&s' },
    { company_id: 'HOKINGS',     name: 'Honor of Kings',                          img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZX-PAW6QkqYdp7trccXwVR1ajzX8Vm0U2CQ&s' },
    { company_id: 'IDENTITYV',   name: 'Identity V',                              img: 'https://play-lh.googleusercontent.com/8-SniYIRaeki791FyNlRggRuIjlxBpYM9k6F7q1UL75FW7IEUSWridDbrXmX5DkTokRq' },
    { company_id: 'LOL',         name: 'League of Legends',                       img: 'https://cdn1.epicgames.com/offer/24b9b5e323bc40eea252a10cdd3b2f10/EGS_LeagueofLegends_RiotGames_S1_2560x1440-47eb328eac5ddd63ebd096ded7d0d5ab' },
    { company_id: 'WILDRIFT',    name: 'League of Legends: Wild Rift',            img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPyVCHfZBp9NukaMfx2Qa0Iqf464NxnS_-1w&s' },
    { company_id: 'LOR',         name: 'Legends of Runeterra',                    img: 'https://cdn1.epicgames.com/offer/4fb89e9f47fe48258314c366649c398e/EGS_LegendsofRuneterra_RiotGames_S1_2560x1440-53b4135a798b686f67f2a95de625858f' },
    { company_id: 'LDSPACE',     name: 'Love and Deepspace',                      img: 'https://play-lh.googleusercontent.com/2cqFDGrjdmP425_o2a98siF7iUYkXMYhwR1ca94a_0v9Iw_hpe8t26DzaFICvYgecQc' },
    { company_id: 'MAGICCHESS',  name: 'Magic Chess: Go Go',                     img: 'https://cdn-bgp.bluestacks.com/BGP/us/gametiles_com.mobilechess.gp.jpg' },
    { company_id: 'MPS-RE',      name: 'MapleStory R: Evolution',                 img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9SHP5ocNaNUOAehcZ5N9mw0U6F1uCEsL3Yw&s' },
    { company_id: 'MARVELSNAP',  name: 'MARVEL SNAP',                             img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1997040/capsule_616x353.jpg?t=1743019547' },
    { company_id: 'METALSLUG',   name: 'Metal Slug: Awakening',                  img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2963870/capsule_616x353.jpg?t=1737939922' },
    { company_id: 'MLBB',        name: 'Mobile Legends: Bang Bang',               img: 'https://kaleoz-media.seagmcdn.com/kaleoz-store/202508/oss-6bd59c7215e1047c83deefb629186c94.png?x-oss-process=image/format,webp' },
    { company_id: 'MUAA',        name: 'MU Archangel',                            img: 'https://s.isanook.com/ga/0/ud/212/1063489/mu-1.jpg?ip/crop/w1200h700/q80/jpg' },
    { company_id: 'MU3-M',       name: 'MU Origin 3',                             img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBfiZcCs4KFlmqxvepqF13xGJqwKyQjSAi3w&s' },
    { company_id: 'OVERWATCH2',  name: 'Overwatch 2',                             img: 'https://mpics-cdn.mgronline.com/pics/Images/565000005678301.JPEG' },
    { company_id: 'PSN',         name: 'PlayStation Store',                       img: 'https://gmedia.playstation.com/is/image/SIEPDC/ps-store-listing-thumb-01-en-05nov20?$facebook$' },
    { company_id: 'PUBGM-RAZER', name: 'PUBG Mobile (UC STATION)',                img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrknFKEIwPP-RbVEAZmCKeJFZ4en18R24l9w&s' },
    { company_id: 'PUBGM',       name: 'PUBG Mobile (Global)',                    img: 'https://esportsinsider.com/wp-content/uploads/2023/01/pubg-mobile-global-championship-viewership.jpg' },
    { company_id: 'RO-M-CSC',   name: 'Ragnarok M: Classic',                     img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYAirjPcogpnavYcoNN0FCAsFdIQVSbsqwgA&s' },
    { company_id: 'RO-M',        name: 'Ragnarok M: Eternal Love',               img: 'https://www.mustplay.in.th/static/thumb/2018/9/30/attach-1540876287062.jpg' },
    { company_id: 'ROO',         name: 'Ragnarok Original',                       img: 'https://play-lh.googleusercontent.com/IFPbKbY13tK8M3-cSaZeFZrFlJ1zSO85z4b7zP50NvipOk1IYx91TLcuZh958ulAjMQd=w750' },
    { company_id: 'ROX',         name: 'Ragnarok X: Next Generation',             img: 'https://play-lh.googleusercontent.com/ploZ5a-s3_jIA4zi-9oICMasgnmKevk_8_GpO_bK2X4g9ejrmJi7GGezdfn06uBYwTnaPdWs3RMWpvOaUqygYA' },
    { company_id: 'MOL',         name: 'Razer Gold',                              img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7y0V5h0idFszTTIZRPd3qjT2Fxc1tkYD_eg&s' },
    { company_id: 'ROBLOX',      name: 'Roblox Gift Card',                        img: 'https://pic.bittopup.com/apiUpload/abe57817ffa1af2bb19cfef4d9b4917b.png' },
    { company_id: 'ROV-M',       name: 'RoV Mobile',                              img: 'https://play-lh.googleusercontent.com/fWAs7pgAaEwNk5gGF0sOsdO-dKUmxm94wEeGbXEF7fsmcnEOTqqkJtqvFEDwk3w_F3wiFDlr9-eX5DtLK1GJCw' },
    { company_id: 'SAUSAGE',     name: 'Sausage Man',                             img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvclzFVaMQOuVxHVGaonrL3PJ-YciK4uhTyg&s' },
    { company_id: 'SEAL-M',      name: 'Seal M',                                  img: 'https://play-lh.googleusercontent.com/A909JQbxMxmjCoWX7ykm8vPu46FvnTSN_o8mA-khVsG3HIbfNtxC7UJbAkoz--tXal4' },
    { company_id: 'SKRE',        name: 'Seven Knights Re:BIRTH',                  img: 'https://sgimage.netmarble.com/images/netmarble/tskgb/20250916/nave1758009046995.jpg' },
    { company_id: 'STARBUCKS',   name: 'Starbucks e-Coupon',                      img: 'https://www.krungsri.com/getmedia/00cd4fcd-3146-4b0b-92a0-ea8bbd175f7d/starbucks-gift-card.jpg.aspx?resizemode=1' },
    { company_id: 'STEAM',       name: 'Steam Wallet Code',                       img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmZsfKcDpY1gbovHCecpyRl-ORlm_ldierxA&s' },
    { company_id: 'SUPERSUS',    name: 'Super Sus',                               img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2920270/capsule_616x353.jpg?t=1725626076' },
    { company_id: 'SWOJTC',      name: 'Sword of Justice',                        img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2782500/1747b6c7ee067fa2e70a1e3b45fc9712364b3681/header.jpg?t=1763116370' },
    { company_id: 'VALORANT-D',  name: 'Valorant',                                img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQhbzaozI9HwUzU4ngAqR5Pekn99oTd6knKA&s' },
    { company_id: 'WWM',         name: 'Where Winds Meet',                        img: 'https://cdn1.epicgames.com/spt-assets/a55e4c8b015d445195aab2f028deace6/where-winds-meet-goctg.jpg?resize=1&w=480&h=270&quality=medium' },
    { company_id: 'WHITEOUTSV',  name: 'Whiteout Survival',                      img: 'https://cdn-www.bluestacks.com/bs-images/227d4335274e46f4a63a87ab46d12ec61742970383.webp' },
    { company_id: 'WUWAVEST',    name: 'Wuthering Waves',                         img: 'https://cdn2.unrealengine.com/wuthering-waves-zhezhi-1200x675-25f8158bf918.jpg' },
    { company_id: 'XHERO',       name: 'X-HERO',                                  img: 'https://kaleoz-media.seagmcdn.com/kaleoz-store/202502/oss-da14791da08cbb0dbfead27bc5e82baa.jpg' },
    { company_id: 'ZZZERO',      name: 'Zenless Zone Zero',                       img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqDjtfEUkNy4IMHJA7kWThA8G4EcCaIu8AuA&s' },
    { company_id: 'ZEPETO',      name: 'ZEPETO',                                  img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5yKvM7Cw1F1xo-ySLknOObSpUSsfvdT5rtQ&s' },
];

async function seed() {
    console.log(`🌱 Seeding ${gameImages.length} game images into game_settings...`);
    let success = 0;
    let failed = 0;

    // Ensure unique index exists on game_settings.company_id
    try {
        await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_game_settings_company_id ON game_settings(company_id)`);
        console.log('✅ Unique index on game_settings.company_id ensured');
    } catch(e) {
        console.log('ℹ️ Index check:', e.message);
    }

    for (const game of gameImages) {
        try {
            await db.execute({
                sql: `INSERT INTO game_settings (company_id, custom_name, custom_image_url, is_active)
                      VALUES (?, ?, ?, 1)
                      ON CONFLICT(company_id) DO UPDATE SET
                      custom_name = excluded.custom_name,
                      custom_image_url = excluded.custom_image_url`,
                args: [game.company_id, game.name, game.img]
            });
            console.log(`  ✅ ${game.company_id} — ${game.name}`);
            success++;
        } catch(e) {
            console.error(`  ❌ ${game.company_id}: ${e.message}`);
            failed++;
        }
    }

    console.log(`\n🚀 Done! ${success} success, ${failed} failed.`);
}

seed();
