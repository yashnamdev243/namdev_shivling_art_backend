require("dotenv").config();
require("./models/Product");
require("./models/Product");
require("./models/Category");
require("./models/Contact");

const app = require("./app");

const sequelize = require("./config/database");

sequelize
  .sync()
  .then(() =>
    app.listen(process.env.PORT || 5000, () => console.log("Server running")),
  )
  .catch(console.error);
