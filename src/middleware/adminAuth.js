const jwt = require("jsonwebtoken");

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

function requireAdmin(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "Admin login required." });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role !== "admin" && payload.type !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required." });
    }

    req.admin = payload;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired admin token." });
  }
}

module.exports = { requireAdmin };
