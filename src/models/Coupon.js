const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Coupon = sequelize.define(
  "Coupon",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    code: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,

      set(value) {
        this.setDataValue(
          "code",
          String(value || "").trim().toUpperCase()
        );
      },
    },

    title: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    discount_type: {
      type: DataTypes.ENUM("percentage", "fixed"),
      allowNull: false,
      defaultValue: "percentage",
    },

    discount_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    // IMPORTANT:
    // DB column = min_order_amount
    min_order_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // IMPORTANT:
    // DB column = max_discount
    max_discount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },

    usage_limit: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    per_user_limit: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },

    starts_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // DB has BOOLEAN/TINYINT is_active
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    festival_name: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    applies_to_all: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "coupons",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["code"],
      },
      {
        fields: ["is_active", "starts_at", "expires_at"],
      },
    ],
  }
);

module.exports = Coupon;