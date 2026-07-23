const router = require("express").Router();

const categoryController = require("../controllers/categoryController");
const upload = require("../middleware/upload");

// Create
router.post(
  "/",
  upload.single("image"),
  categoryController.create
);

// Get All
router.get(
  "/",
  categoryController.getAll
);

// Get One
router.get(
  "/:id",
  categoryController.getOne
);

// Update
router.put(
  "/:id",
  upload.single("image"),
  categoryController.update
);

// Delete
router.delete(
  "/:id",
  categoryController.remove
);

module.exports = router;