const router = require("express").Router();
const controller = require("../controllers/authController");
const { requireUser } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/register", authLimiter, controller.register);
router.post("/login", authLimiter, controller.login);
router.get("/me", requireUser, controller.me);
router.put("/profile", requireUser, controller.updateProfile);
router.post("/logout", requireUser, controller.logout);

module.exports = router;
