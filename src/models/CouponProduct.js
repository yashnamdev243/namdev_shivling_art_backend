const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CouponProduct = sequelize.define("CouponProduct", {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  coupon_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: "coupon_products",
  timestamps: true,
  indexes: [{ unique: true, fields: ["coupon_id", "product_id"] }],
});

module.exports = CouponProduct;
