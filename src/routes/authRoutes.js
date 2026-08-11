const router = require("express").Router();
const controller = require("../controllers/authController");
const { requireUser } = require("../middleware/auth");

router.post("/register", controller.register);
router.post("/login", controller.login);
router.get("/me", requireUser, controller.me);
router.post("/logout", requireUser, controller.logout);

module.exports = router;
