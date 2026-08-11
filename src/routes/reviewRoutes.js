const router = require("express").Router();
const c = require("../controllers/reviewController");
const { requireUser } = require("../middleware/auth");

router.get("/featured", c.testimonials);
router.get("/testimonials", c.testimonials);
router.get("/product/:productId", c.listByProduct);
router.post("/product/:productId", requireUser, c.create);

module.exports = router;
