const router = require("express").Router();
const admin = require("../controllers/adminController");
const { requireAdmin } = require("../middleware/adminAuth");
const reviews = require("../controllers/adminReviewController");
const users = require("../controllers/adminUserController");
const wishlist = require("../controllers/wishlistController");
const like = require("../controllers/likeController");
const coupons = require("../controllers/couponController");

router.post("/login", admin.login);
router.post("/logout", requireAdmin, admin.logout);
router.get("/me", requireAdmin, admin.me);

router.use(requireAdmin);

router.get("/users", users.listUsers);
router.patch("/users/:id/status", users.updateStatus);
router.get("/activity", users.activity);

router.get("/reviews", reviews.list);
router.patch("/reviews/:id/status", reviews.updateStatus);
router.patch("/reviews/:id/approve", reviews.approve);
router.patch("/reviews/:id/reject", reviews.reject);
router.patch("/reviews/:id/feature", reviews.feature);
router.delete("/reviews/:id", reviews.remove);

router.get("/wishlists", wishlist.adminList);
router.get("/likes", like.adminList);
router.get("/products/:productId/likes", like.users);

router.get("/coupons", coupons.adminList);
router.post("/coupons", coupons.adminCreate);
router.put("/coupons/:id", coupons.adminUpdate);
router.delete("/coupons/:id", coupons.adminDelete);
router.get("/coupons/redemptions", coupons.adminRedemptions);

module.exports = router;
