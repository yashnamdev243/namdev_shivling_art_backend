const router = require("express").Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/stats", dashboardController.getStats);

module.exports = router;