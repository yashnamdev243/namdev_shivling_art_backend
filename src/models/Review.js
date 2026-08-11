const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Review = sequelize.define("Review", {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  rating: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  comment: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    allowNull: false,
    defaultValue: "approved",
  },
  is_featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: "reviews",
  timestamps: true,
  indexes: [
    { unique: true, fields: ["product_id", "user_id"] },
    { fields: ["product_id", "status"] },
    { fields: ["status", "is_featured"] },
  ],
});

module.exports = Review;
