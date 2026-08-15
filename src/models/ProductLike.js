
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductLike = sequelize.define(
  "ProductLike",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // users.id = BIGINT UNSIGNED
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

    // products.id = INT
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
  },
  {
    tableName: "product_likes",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["user_id", "product_id"],
      },
      {
        fields: ["product_id"],
      },
    ],
  }
);

module.exports = ProductLike;