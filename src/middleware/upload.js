// const multer = require(C"multer");
// const path = require("path");

// // const storage = multer.diskStorage({
// //   destination: "uploads",
// //   filename: (req, file, cb) => {
// //     cb(null, Date.now() + path.extname(file.originalname));
// //   },
// // });
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     console.log("Saving to:", "uploads");
//     cb(null, "uploads");
//   },
//   filename: (req, file, cb) => {
//     const name = Date.now() + path.extname(file.originalname);
//     console.log("Filename:", name);
//     cb(null, name);
//   },
// });

// module.exports = multer({ storage });


const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 80);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type."));
  }
  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});
