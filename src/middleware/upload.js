const multer = require("multer");
const path = require("path");

// const storage = multer.diskStorage({
//   destination: "uploads",
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Saving to:", "uploads");
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const name = Date.now() + path.extname(file.originalname);
    console.log("Filename:", name);
    cb(null, name);
  },
});

module.exports = multer({ storage });