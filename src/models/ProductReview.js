// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/database");

// const ProductReview = sequelize.define("ProductReview", {
//   id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
//   user_id: { type: DataTypes.INTEGER, allowNull: false },
//   product_id: { type: DataTypes.INTEGER, allowNull: false },
//   rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, validate: { min: 1, max: 5 } },
//   comment: { type: DataTypes.TEXT, allowNull: false },
//   status: { type: DataTypes.ENUM("pending", "approved", "rejected"), allowNull: false, defaultValue: "pending" },
//   is_featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
// }, {
//   tableName: "product_reviews",
//   indexes: [
//     { unique: true, fields: ["user_id", "product_id"] },
//     { fields: ["product_id", "status"] },
//     { fields: ["is_featured", "status"] },
//   ],
// });

// module.exports = ProductReview;


const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductReview = sequelize.define(
  "ProductReview",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Must match users.id
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    // Must match products.id
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    rating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },

    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        "pending",
        "approved",
        "rejected"
      ),
      allowNull: false,
      defaultValue: "pending",
    },

    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "product_reviews",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["user_id", "product_id"],
      },
      {
        fields: ["product_id", "status"],
      },
      {
        fields: ["is_featured", "status"],
      },
    ],
  }
);

module.exports = ProductReview;