const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ActivityLog } = require("../models");

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  avatar: user.avatar,
  phone: user.phone,
  city: user.city,
  createdAt: user.createdAt,
});

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: "user" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "30d" },
  );

async function logActivity(userId, req, action, metadata = {}) {
  try {
    await ActivityLog.create({
      user_id: userId,
      action,
      metadata,
      ip_address: req.ip,
      user_agent: req.get("user-agent") || null,
    });
  } catch (e) {
    console.error("Activity log:", e.message);
  }
}

exports.register = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (name.length < 2)
      return res
        .status(400)
        .json({
          success: false,
          message: "Name must be at least 2 characters.",
        });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res
        .status(400)
        .json({
          success: false,
          message: "Please enter a valid email address.",
        });
    if (password.length < 6)
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 6 characters.",
        });

    const existing = await User.findOne({ where: { email } });
    if (existing)
      return res
        .status(409)
        .json({
          success: false,
          message: "An account with this email already exists. Please login.",
        });

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role: "user",
      status: "active",
    });

    await logActivity(user.id, req, "REGISTER");
    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token: generateToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    if (error.name === "SequelizeUniqueConstraintError")
      return res
        .status(409)
        .json({
          success: false,
          message: "An account with this email already exists.",
        });
    return res
      .status(500)
      .json({ success: false, message: "Unable to create your account." });
  }
};

exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });

    const user = await User.findOne({ where: { email } });
    if (!user || user.role !== "user")
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    if (user.status !== "active")
      return res
        .status(403)
        .json({
          success: false,
          message: "Your account is inactive. Please contact us.",
        });
    if (!(await bcrypt.compare(password, user.password)))
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });

    await logActivity(user.id, req, "LOGIN");
    return res.json({
      success: true,
      message: "Login successful.",
      token: generateToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: "Login failed. Please try again." });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== "user")
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    if (user.status !== "active")
      return res
        .status(403)
        .json({ success: false, message: "Your account is inactive." });
    return res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    console.error("ME ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load your account." });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user || user.role !== "user") {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const city = String(req.body.city || "").trim();
    const phone =
      req.body.phone !== undefined
        ? String(req.body.phone || "").trim()
        : undefined;
    const avatar = req.body.avatar !== undefined ? req.body.avatar : undefined;

    // Validation
    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser && existingUser.id !== user.id) {
        return res.status(409).json({
          success: false,
          message: "This email address is already in use.",
        });
      }
    }

    // Update profile
    user.name = name;
    user.email = email;
    user.city = city || null;

    if (phone !== undefined) {
      user.phone = phone || null;
    }
    if (avatar !== undefined) {
      user.avatar = avatar || null;
    }

    await user.save();

    await logActivity(user.id, req, "PROFILE_UPDATE", {
      fields: ["name", "email", "city", "phone", "avatar"].filter((f) =>
        f === "avatar"
          ? avatar !== undefined
          : f === "phone"
            ? phone !== undefined
            : true,
      ),
    });

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "This email address is already in use.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Unable to update your profile.",
    });
  }
};
exports.logout = async (req, res) => {
  await logActivity(req.user?.id, req, "LOGOUT");
  return res.json({ success: true, message: "Logout successful." });
};
