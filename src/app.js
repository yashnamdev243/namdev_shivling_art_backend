const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
console.log("Uploading to:", path.resolve("uploads"));
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");


const app = express();

app.use(cors());
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);app.use(morgan("dev"));
app.use(express.json());

// app.use("/uploads", express.static("src/uploads"));
// app.use(
//   "/uploads",
//   express.static(path.join(__dirname, "uploads"))
// );
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);
console.log("Serving uploads from:", path.join(process.cwd(), "uploads"));
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);

module.exports = app;