// const jwt = require("jsonwebtoken");

// const getToken = (req) => {
//   const header = req.headers.authorization;
//   return header && header.startsWith("Bearer ")
//     ? header.slice(7).trim()
//     : null;
// };

// const requireUser = (req, res, next) => {
//   try {
//     const token = getToken(req);
//     if (!token)
//       return res.status(401).json({ success:false, message:"Login required." });

//     req.user = jwt.verify(token, process.env.JWT_SECRET);
//     next();
//   } catch {
//     res.status(401).json({
//       success:false,
//       message:"Your session has expired. Please login again."
//     });
//   }
// };

// const requireAdmin = (req, res, next) => {
//   try {
//     const token = getToken(req);
//     if (!token)
//       return res.status(401).json({ success:false, message:"Admin login required." });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     if (decoded.role !== "admin")
//       return res.status(403).json({ success:false, message:"Admin access required." });

//     req.user = decoded;
//     next();
//   } catch {
//     res.status(401).json({ success:false, message:"Invalid admin session." });
//   }
// };

// module.exports = { requireUser, requireAdmin };


const jwt = require("jsonwebtoken");

const requireUser = (req, res, next) => {
  try {
    // =====================================================
    // GET AUTHORIZATION HEADER
    // =====================================================

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Expected:
    // Authorization: Bearer YOUR_TOKEN

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    // =====================================================
    // GET TOKEN
    // =====================================================

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
      });
    }

    // =====================================================
    // CHECK JWT SECRET
    // =====================================================

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is not configured in environment variables."
      );

      return res.status(500).json({
        success: false,
        message: "Authentication configuration error.",
      });
    }

    // =====================================================
    // VERIFY TOKEN
    // =====================================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // =====================================================
    // VALIDATE TOKEN PAYLOAD
    // =====================================================

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // =====================================================
    // SET AUTHENTICATED USER
    // =====================================================

    req.user = decoded;

    // Keep req.userId for existing controllers
    // such as wishlistController/activity logging.
    req.userId = decoded.id;

    // =====================================================
    // CONTINUE
    // =====================================================

    next();
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error);

    // JWT expired
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired.",
      });
    }

    // Invalid JWT
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // General error
    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

module.exports = {
  requireUser,
};