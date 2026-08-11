// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/database");

// const Category = sequelize.define(
//   "Category",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//     },

//     name: {
//       type: DataTypes.STRING(100),
//       allowNull: false,
//       unique: true,
//       validate: {
//         notEmpty: true,
//       },
//     },

//     description: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//     },

//     image: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//   },
//   {
//     tableName: "categories",
//     timestamps: true,
//   }
// );

// module.exports = Category;


// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/database");

// const Category = sequelize.define(
//   "Category",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//     name: { type: DataTypes.STRING(191), allowNull: false, unique: true },
//     slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
//     description: { type: DataTypes.TEXT, allowNull: true },
//     image: { type: DataTypes.STRING(500), allowNull: true },
//     status: {
//       type: DataTypes.ENUM("active", "inactive"),
//       allowNull: false,
//       defaultValue: "active",
//     },
//   },
//   {
//     tableName: "categories",
//   },
// );

// module.exports = Category;

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },

    slug: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    tableName: "categories",
    timestamps: true,
  }
);

module.exports = Category;
