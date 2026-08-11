// // const { DataTypes } = require("sequelize");
// // const sequelize = require("../config/database");

// // const Wishlist = sequelize.define(
// //   "Wishlist",
// //   {
// //     id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
// //     user_id: { type: DataTypes.INTEGER, allowNull: false },
// //     product_id: { type: DataTypes.INTEGER, allowNull: false },
// //   },
// //   {
// //     tableName: "wishlists",
// //     indexes: [
// //       { unique: true, fields: ["user_id", "product_id"] },
// //       { fields: ["product_id"] },
// //     ],
// //   },
// // );

// // module.exports = Wishlist;

// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/database");

// const Wishlist = sequelize.define(
//   "Wishlist",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//     },

//     // users.id = BIGINT UNSIGNED
//     user_id: {
//       type: DataTypes.BIGINT.UNSIGNED,
//       allowNull: false,
//       references: {
//         model: "users",
//         key: "id",
//       },
//       onDelete: "CASCADE",
//       onUpdate: "CASCADE",
//     },

//     // products.id = INT
//     product_id: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: "products",
//         key: "id",
//       },
//       onDelete: "CASCADE",
//       onUpdate: "CASCADE",
//     },
//   },
//   {
//     tableName: "wishlists",
//     timestamps: true,

//     indexes: [
//       {
//         unique: true,
//         fields: ["user_id", "product_id"],
//       },
//       {
//         fields: ["product_id"],
//       },
//     ],
//   }
// );

// module.exports = Wishlist;



const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Wishlist = sequelize.define(
  "Wishlist",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

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
    tableName: "wishlists",
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

module.exports = Wishlist;