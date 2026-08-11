// const { Sequelize } = require("sequelize");
// require("dotenv").config();

// console.log("DB_NAME =", process.env.DB_NAME);
// console.log("DB_USER =", process.env.DB_USER);
// console.log("DB_PASSWORD =", process.env.DB_PASSWORD);
// console.log("DB_HOST =", process.env.DB_HOST);
// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     dialect: "mysql",
//     logging: false,
//   },
// );
// module.exports = sequelize;


const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
    },
  }
);

module.exports = sequelize;
