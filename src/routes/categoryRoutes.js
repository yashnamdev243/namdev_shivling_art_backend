const router = require("express").Router();
const categoryController = require("../controllers/categoryController");
const upload = require("../middleware/upload");
const { requireAdmin } = require("../middleware/adminAuth");

router.get("/", categoryController.getAll);
router.get("/:id", categoryController.getOne);
router.post("/", requireAdmin, upload.single("image"), categoryController.create);
router.put("/:id", requireAdmin, upload.single("image"), categoryController.update);
router.delete("/:id", requireAdmin, categoryController.remove);

module.exports = router;
