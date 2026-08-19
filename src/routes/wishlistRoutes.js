const router = require("express").Router();
const c = require("../controllers/wishlistController");
const { requireUser } = require("../middleware/auth");
const { actionLimiter } = require("../middleware/rateLimiter");

router.get("/", requireUser, c.list);
router.post("/:productId", requireUser, actionLimiter, c.toggle);
router.delete("/:productId", requireUser, c.remove);

module.exports = router;
