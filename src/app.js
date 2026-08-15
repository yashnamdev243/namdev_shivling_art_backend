const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const contactRoutes = require("./routes/contactRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const couponRoutes = require("./routes/couponRoutes");

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(new Error("CORS origin not allowed."));
    },
    credentials: true,
  }),
);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsPath));

app.get("/api/health", (_req, res) =>
  res.json({
    success: true,
    message: "API is running.",
    time: new Date().toISOString(),
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);

app.use((req, res) =>
  res
    .status(404)
    .json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    }),
);

app.use((err, _req, res, _next) => {
  console.error("UNHANDLED ERROR:", err);
  const status =
    err.status || (err.message === "CORS origin not allowed." ? 403 : 500);
  res
    .status(status)
    .json({
      success: false,
      message: status === 500 ? "Internal server error." : err.message,
    });
});

module.exports = app;
