// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/database");

// const ActivityLog = sequelize.define("ActivityLog", {
//   id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
//   user_id: { type: DataTypes.INTEGER, allowNull: true },
//   product_id: { type: DataTypes.INTEGER, allowNull: true },
//   action: { type: DataTypes.STRING(80), allowNull: false },
//   metadata: { type: DataTypes.JSON, allowNull: true },
//   ip_address: { type: DataTypes.STRING(64), allowNull: true },
//   user_agent: { type: DataTypes.TEXT, allowNull: true },
// }, {
//   tableName: "activity_logs",
//   indexes: [
//     { fields: ["user_id"] },
//     { fields: ["product_id"] },
//     { fields: ["action"] },
//     { fields: ["createdAt"] },
//   ],
// });

// module.exports = ActivityLog;


const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ActivityLog = sequelize.define(
  "ActivityLog",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // users.id = BIGINT UNSIGNED
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },

    // products.id = INT
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "products",
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },

    action: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },

    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    ip_address: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },

    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "activity_logs",

    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["product_id"],
      },
      {
        fields: ["action"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);

module.exports = ActivityLog;