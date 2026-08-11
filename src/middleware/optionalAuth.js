const jwt = require("jsonwebtoken");

module.exports = function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ") || !process.env.JWT_SECRET) return next();

  try {
    const decoded = jwt.verify(header.slice(7).trim(), process.env.JWT_SECRET);
    if (decoded?.id && decoded.role === "user") {
      req.user = decoded;
      req.userId = decoded.id;
    }
  } catch (_) {}
  next();
};
