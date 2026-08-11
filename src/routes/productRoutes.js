const router = require("express").Router();
const c = require("../controllers/productController");
const like = require("../controllers/likeController");
const reviews = require("../controllers/reviewController");
const up = require("../middleware/upload");
const { requireUser } = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const { requireAdmin } = require("../middleware/adminAuth");

router.get("/", c.getAll);
router.get("/random", c.getRandom);
router.post("/", requireAdmin, up.single("image"), c.create);
router.post("/:productId/like", requireUser, like.toggle);
router.get("/:productId/like", optionalAuth, like.status);
router.get("/:productId/likes", like.users);
router.get("/:productId/reviews", reviews.listByProduct);
router.post("/:productId/reviews", requireUser, reviews.create);
router.get("/:id", c.getOne);
router.put("/:id", requireAdmin, up.single("image"), c.update);
router.delete("/:id", requireAdmin, c.remove);

module.exports = router;
