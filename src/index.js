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

const app = express();
const PORT = process.env.PORT || 10000;

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

const devOrigins = ["http://localhost:5173", "http://localhost:3000", "http://localhost:5000"];
const envOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(o => o.length > 0);
const allowedOrigins = Array.from(new Set([...devOrigins, ...envOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(hpp());
app.use("/api", apiLimiter);
app.disable("x-powered-by");

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/peamsub", peamsubRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/wepay-game", wepayRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "🎮 GameTopUp API is running on Render!",
    version: "1.0.0"
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Backend running on port ${PORT}`);
});
