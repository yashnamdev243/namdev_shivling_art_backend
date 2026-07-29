// routes/contactRoutes.js

const express = require("express");
const router = express.Router();

const contactController = require("../controllers/contactController");

router.post("/", contactController.send);

module.exports = router;