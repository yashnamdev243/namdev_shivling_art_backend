const rateLimit = require("express-rate-limit");

// General API traffic — generous, just stops runaway loops/bots
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down and try again shortly." },
});

// Auth endpoints — tighter, prevents brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again in a few minutes." },
});

// Coupon apply — prevents brute-forcing codes / hammering the DB
const couponLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many coupon attempts. Please wait a bit before trying again." },
});

// Like/wishlist/review toggles — fast actions but still bounded
const actionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "You're doing that too often. Please slow down." },
});

module.exports = { generalLimiter, authLimiter, couponLimiter, actionLimiter };