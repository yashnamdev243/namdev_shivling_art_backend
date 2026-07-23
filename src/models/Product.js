const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Product = sequelize.define(
  "Product",
  {
    product_code: {
      type: DataTypes.STRING,
      unique: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    slug: DataTypes.STRING,

    category: DataTypes.STRING,

    short_description: DataTypes.TEXT,

    description: DataTypes.TEXT,

    price: DataTypes.DECIMAL(10, 2),

    discount_price: DataTypes.DECIMAL(10, 2),

    stock: DataTypes.INTEGER,

    weight: DataTypes.DECIMAL(10, 2),

    material: DataTypes.STRING,

    color: DataTypes.STRING,

    height: DataTypes.STRING,

    width: DataTypes.STRING,

    length: DataTypes.STRING,

    image: DataTypes.STRING,

    gallery: DataTypes.JSON,

    featured: DataTypes.BOOLEAN,

    status: DataTypes.STRING,

    meta_title: DataTypes.STRING,

    meta_description: DataTypes.TEXT,
  },
  {
    tableName: "products",
    timestamps: true,
  }
);

module.exports = Product;