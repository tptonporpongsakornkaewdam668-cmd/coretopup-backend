const express = require("express");
const router = express.Router();

// ─── Game Data (ตรงกับ frontend /src/data/games.ts) ──────────────────────────
const games = [
    {
        id: "1",
        slug: "free-fire",
        name: "Free Fire",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop",
        description: "เติมเพชร Free Fire รวดเร็ว ปลอดภัย ได้รับทันที",
        category: "Battle Royale",
        packages: [
            { id: "ff-1", name: "100 Diamonds", amount: 100, price: 34, currency: "THB" },
            { id: "ff-2", name: "310 Diamonds", amount: 310, price: 102, currency: "THB" },
            { id: "ff-3", name: "520 Diamonds", amount: 520, price: 168, currency: "THB" },
            { id: "ff-4", name: "1060 Diamonds", amount: 1060, price: 336, currency: "THB" },
            { id: "ff-5", name: "2180 Diamonds", amount: 2180, price: 672, currency: "THB" },
        ],
    },
    {
        id: "2",
        slug: "pubg-mobile",
        name: "PUBG Mobile",
        image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=300&fit=crop",
        description: "เติม UC PUBG Mobile ราคาถูก ได้ทันที",
        category: "Battle Royale",
        packages: [
            { id: "pubg-1", name: "60 UC", amount: 60, price: 29, currency: "THB" },
            { id: "pubg-2", name: "325 UC", amount: 325, price: 149, currency: "THB" },
            { id: "pubg-3", name: "660 UC", amount: 660, price: 299, currency: "THB" },
            { id: "pubg-4", name: "1800 UC", amount: 1800, price: 799, currency: "THB" },
        ],
    },
    {
        id: "3",
        slug: "roblox",
        name: "Roblox",
        image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop",
        description: "เติม Robux ง่ายๆ ราคาพิเศษ",
        category: "Sandbox",
        packages: [
            { id: "rb-1", name: "400 Robux", amount: 400, price: 165, currency: "THB" },
            { id: "rb-2", name: "800 Robux", amount: 800, price: 330, currency: "THB" },
            { id: "rb-3", name: "1700 Robux", amount: 1700, price: 660, currency: "THB" },
            { id: "rb-4", name: "4500 Robux", amount: 4500, price: 1650, currency: "THB" },
        ],
    },
    {
        id: "4",
        slug: "mobile-legends",
        name: "Mobile Legends",
        image: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop",
        description: "เติมเพชร Mobile Legends ราคาถูก โปรโมชั่นพิเศษ",
        category: "MOBA",
        packages: [
            { id: "ml-1", name: "86 Diamonds", amount: 86, price: 29, currency: "THB" },
            { id: "ml-2", name: "172 Diamonds", amount: 172, price: 55, currency: "THB" },
            { id: "ml-3", name: "257 Diamonds", amount: 257, price: 79, currency: "THB" },
            { id: "ml-4", name: "706 Diamonds", amount: 706, price: 219, currency: "THB" },
        ],
    },
    {
        id: "5",
        slug: "genshin-impact",
        name: "Genshin Impact",
        image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=300&fit=crop",
        description: "เติม Genesis Crystals Genshin Impact อัตโนมัติ",
        category: "RPG",
        packages: [
            { id: "gi-1", name: "60 Genesis Crystals", amount: 60, price: 35, currency: "THB" },
            { id: "gi-2", name: "330 Genesis Crystals", amount: 330, price: 179, currency: "THB" },
            { id: "gi-3", name: "1090 Genesis Crystals", amount: 1090, price: 549, currency: "THB" },
            { id: "gi-4", name: "2240 Genesis Crystals", amount: 2240, price: 1099, currency: "THB" },
        ],
    },
    {
        id: "6",
        slug: "valorant",
        name: "Valorant",
        image: "https://images.unsplash.com/photo-1552820728-8b83bb6b2b28?w=400&h=300&fit=crop",
        description: "เติม Valorant Points ราคาดี ได้ทันที",
        category: "FPS",
        packages: [
            { id: "vl-1", name: "475 VP", amount: 475, price: 159, currency: "THB" },
            { id: "vl-2", name: "1000 VP", amount: 1000, price: 319, currency: "THB" },
            { id: "vl-3", name: "2050 VP", amount: 2050, price: 639, currency: "THB" },
            { id: "vl-4", name: "3650 VP", amount: 3650, price: 1099, currency: "THB" },
        ],
    },
];

// ─── GET /api/games ───────────────────────────────────────────────────────────
router.get("/", (req, res) => {
    const { category } = req.query;
    let result = games;

    if (category) {
        result = games.filter((g) => g.category.toLowerCase() === category.toLowerCase());
    }

    // ไม่ return packages ใน list เพื่อลด payload
    const simplified = result.map(({ packages, ...rest }) => rest);

    res.json({ success: true, data: simplified });
});

// ─── GET /api/games/:slug ─────────────────────────────────────────────────────
router.get("/:slug", (req, res) => {
    const game = games.find((g) => g.slug === req.params.slug);
    if (!game) {
        return res.status(404).json({ success: false, message: "ไม่พบเกมนี้" });
    }

    res.json({ success: true, data: game });
});

module.exports = router;
