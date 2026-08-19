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
    pool: {
      max: 20, // max concurrent connections in pool
      min: 2, // keep a few warm
      acquire: 30000, // ms to wait for a connection before erroring (fail fast instead of hanging)
      idle: 10000, // ms a connection can be idle before being released
    },
    retry: {
      max: 3, // retry transient connection errors
    },
    define: {
      timestamps: true,
      underscored: false,
    },
  },
);

module.exports = sequelize;

