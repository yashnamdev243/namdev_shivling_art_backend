const router = require("express").Router();

const couponController = require("../controllers/couponController");
const { requireUser } = require("../middleware/auth");

// Customer
// router.post(
//   "/apply",
//   couponController.apply
// );

// router.get("/active", couponController.active); 
// Customer — must be logged in so we know whose history this is
router.post("/apply", requireUser, couponController.apply);
router.get("/my-redemptions", requireUser, couponController.myRedemptions);
router.get("/active", couponController.active); // must be above "/:id"


// Admin
router.get(
  "/",
  couponController.getAll
);

router.get(
  "/:id",
  couponController.getOne
);

router.post(
  "/",
  couponController.create
);

router.put(
  "/:id",
  couponController.update
);

router.delete(
  "/:id",
  couponController.remove
);

module.exports = router;