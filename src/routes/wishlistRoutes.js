const router = require("express").Router();
const c = require("../controllers/wishlistController");
const { requireUser } = require("../middleware/auth");

router.get("/", requireUser, c.list);
router.post("/:productId", requireUser, c.toggle);
router.delete("/:productId", requireUser, c.remove);

module.exports = router;
