const router = require("express").Router();
const c = require("../controllers/reviewController");
const { requireUser } = require("../middleware/auth");
const { actionLimiter } = require("../middleware/rateLimiter");

router.get("/featured", c.testimonials);
router.get("/testimonials", c.testimonials);
router.get("/product/:productId", c.listByProduct);
router.post("/product/:productId", requireUser, actionLimiter, c.create);

module.exports = router;
