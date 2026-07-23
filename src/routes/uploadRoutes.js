const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

router.post("/image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: false,
      message: "No image uploaded",
    });
  }

  res.json({
    status: true,
    message: "Image uploaded successfully",
    image: `/uploads/${req.file.filename}`,
  });
});

module.exports = router;