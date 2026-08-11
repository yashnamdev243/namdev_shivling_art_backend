const jwt = require("jsonwebtoken");

function configuredAdmin() {
  return {
    email: String(process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
    password: String(process.env.ADMIN_PASSWORD || ""),
    name: process.env.ADMIN_NAME || "Website Admin",
  };
}

exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const admin = configuredAdmin();

    if (!process.env.JWT_SECRET || !admin.email || !admin.password) {
      return res.status(500).json({ success: false, message: "Admin login is not configured on the server." });
    }

    if (email !== admin.email || password !== admin.password) {
      return res.status(401).json({ success: false, message: "Invalid admin email or password." });
    }

    const token = jwt.sign(
      { email: admin.email, role: "admin", type: "admin", name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || "1d" }
    );

    return res.json({
      success: true,
      message: "Admin login successful.",
      token,
      user: { name: admin.name, email: admin.email, role: "admin" },
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    return res.status(500).json({ success: false, message: "Admin login failed." });
  }
};

exports.logout = (_req, res) => res.json({ success: true, message: "Admin logout successful." });
exports.me = (req, res) => res.json({
  success: true,
  user: { name: req.admin.name || "Admin", email: req.admin.email, role: "admin" },
});
