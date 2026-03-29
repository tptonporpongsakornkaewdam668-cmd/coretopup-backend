require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const hpp = require("hpp");
const path = require("path");

const { apiLimiter } = require("./middleware/rateLimiter");
const authRoutes = require("./routes/auth");
const gamesRoutes = require("./routes/games");
const ordersRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const peamsubRoutes = require("./routes/peamsub");
const paymentRoutes = require("./routes/payment");
const historyRoutes = require("./routes/history");
const wepayRoutes = require("./routes/wepay");
const slidersRoutes = require("./routes/sliders");
const discountsRoutes = require("./routes/discounts");
const redeemShopRoutes = require("./routes/redeemShop");
const { initAllTables } = require("./services/initDb");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

const devOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:8080",
  "http://coretopup.com",
  "https://coretopup.com",
  "http://www.coretopup.com",
  "https://www.coretopup.com",
  "https://coretopup.pages.dev",
  "https://www.coretopup.shop",
  "https://coretopup.shop"
];
const envOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(o => o.length > 0);
const allowedOrigins = Array.from(new Set([...devOrigins, ...envOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin === "null") {
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS Blocked: ${origin}`); // Log ดูว่าตัวไหนโดนบล็อก
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(hpp());
app.use("/api", apiLimiter);
app.disable("x-powered-by");

// Base API welcome route
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "🎮 CoreTopup API is ready!",
    env: process.env.NODE_ENV
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/peamsub", peamsubRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/wepay-game", wepayRoutes);
app.use("/api/sliders", slidersRoutes);
app.use("/api/discounts", discountsRoutes);
app.use("/api/redeem-shop", redeemShopRoutes);

// Serve Static Admin Panel
const adminPath = path.join(__dirname, "public", "admin");
app.use("/admin", express.static(adminPath));

// Fallback for /admin to serve index.html (Handles cases without trailing slash)
app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(adminPath, "index.html"));
});

// Serve File Uploads
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// Base API route
app.get("/", (req, res) => {
  res.json({
    message: "🎮 CoreTopup API is running on Render!",
    version: "1.0.0"
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("🔥 Global Error Handler:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, async () => {
  console.log(`\n🚀 Backend running on port ${PORT}`);
  try {
    await initAllTables();
  } catch (err) {
    console.error("❌ DB init failed:", err.message);
  }
});

module.exports = app;
