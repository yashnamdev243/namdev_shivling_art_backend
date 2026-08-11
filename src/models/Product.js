// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/database");

// const Product = sequelize.define(
//   "Product",
//   {
//     product_code: {
//       type: DataTypes.STRING,
//       unique: true,
//     },

//     name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },

//     slug: DataTypes.STRING,

//     category: DataTypes.STRING,

//     short_description: DataTypes.TEXT,

//     description: DataTypes.TEXT,

//     price: DataTypes.DECIMAL(10, 2),

//     discount_price: DataTypes.DECIMAL(10, 2),

//     stock: DataTypes.INTEGER,

//     weight: DataTypes.DECIMAL(10, 2),

//     material: DataTypes.STRING,

//     color: DataTypes.STRING,

//     height: DataTypes.STRING,

//     width: DataTypes.STRING,

//     length: DataTypes.STRING,

//     image: DataTypes.STRING,

//     gallery: DataTypes.JSON,

//     featured: DataTypes.BOOLEAN,

//     status: DataTypes.STRING,

//     meta_title: DataTypes.STRING,

//     meta_description: DataTypes.TEXT,
//   },
//   {
//     tableName: "products",
//     timestamps: true,
//   }
// );

// module.exports = Product;

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Product = sequelize.define("Product", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  product_code: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  category: { type: DataTypes.STRING(191), allowNull: true },
  short_description: { type: DataTypes.TEXT, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  discount_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  image: { type: DataTypes.STRING(500), allowNull: true },
  gallery: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  video: { type: DataTypes.STRING(500), allowNull: true },
  highlights: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
  meta_title: { type: DataTypes.STRING(255), allowNull: true },
  meta_description: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "products",
  indexes: [
    { fields: ["category"] },
    { fields: ["status"] },
    { fields: ["featured"] },
    { fields: ["createdAt"] },
  ],
});

module.exports = Product;
