const router = require("express").Router();
const c = require("../controllers/couponController");
const { requireUser } = require("../middleware/auth");

router.get("/active", c.active);
router.post("/validate", requireUser, c.validate);
router.post("/redeem", requireUser, c.redeem);

module.exports = router;
