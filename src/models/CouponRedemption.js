const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CouponRedemption = sequelize.define("CouponRedemption", {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  coupon_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  order_reference: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  order_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  discount_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
}, {
  tableName: "coupon_redemptions",
  timestamps: true,
  indexes: [
    { fields: ["coupon_id"] },
    { fields: ["user_id"] },
    { fields: ["createdAt"] },
  ],
});

module.exports = CouponRedemption;
