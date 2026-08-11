// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/database");

// const User = sequelize.define(
//   "User",
//   {
//     id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
//     name: { type: DataTypes.STRING(100), allowNull: false },
//     email: {
//       type: DataTypes.STRING(191),
//       allowNull: false,
//       unique: true,
//       validate: { isEmail: true },
//       set(value) {
//         this.setDataValue("email", String(value).trim().toLowerCase());
//       },
//     },
//     password: { type: DataTypes.STRING(255), allowNull: false },
//     role: {
//       type: DataTypes.ENUM("user", "admin"),
//       allowNull: false,
//       defaultValue: "user",
//     },
//     status: {
//       type: DataTypes.ENUM("active", "inactive"),
//       allowNull: false,
//       defaultValue: "active",
//     },
//     avatar: { type: DataTypes.STRING(500), allowNull: true },
//     city: { type: DataTypes.STRING(100), allowNull: true },
//   },
//   { tableName: "users", timestamps: true },
// );

// module.exports = User;


const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,

      validate: {
        notEmpty: {
          msg: "Name is required.",
        },

        len: {
          args: [2, 100],
          msg: "Name must be between 2 and 100 characters.",
        },
      },

      set(value) {
        this.setDataValue(
          "name",
          String(value || "").trim()
        );
      },
    },

    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,

      validate: {
        notEmpty: {
          msg: "Email is required.",
        },

        isEmail: {
          msg: "Please provide a valid email address.",
        },
      },

      set(value) {
        this.setDataValue(
          "email",
          String(value || "")
            .trim()
            .toLowerCase()
        );
      },
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: false,

      validate: {
        notEmpty: {
          msg: "Password is required.",
        },
      },
    },

    role: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
      defaultValue: "user",
    },

    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },

    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },

    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,

      set(value) {
        const city = String(value || "").trim();

        this.setDataValue(
          "city",
          city || null
        );
      },
    },
  },
  {
    tableName: "users",

    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["email"],
      },

      {
        fields: ["status"],
      },

      {
        fields: ["role"],
      },
    ],
  }
);

module.exports = User;