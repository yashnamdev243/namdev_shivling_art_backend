const router = require("express").Router();
const controller = require("../controllers/dashboardController");
const { requireAdmin } = require("../middleware/adminAuth");
router.get("/stats", requireAdmin, controller.getStats);
module.exports = router;
