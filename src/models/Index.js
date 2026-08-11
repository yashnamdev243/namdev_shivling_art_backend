const User = require("./User");
const Product = require("./Product");
const Category = require("./Category");
const Wishlist = require("./Wishlist");
const ProductLike = require("./ProductLike");
const Review = require("./Review");
const ActivityLog = require("./ActivityLog");
const Contact = require("./Contact");
const Coupon = require("./Coupon");
const CouponProduct = require("./CouponProduct");
const CouponRedemption = require("./CouponRedemption");

User.hasMany(Wishlist, { foreignKey: "user_id", as: "wishlists", onDelete: "CASCADE" });
Wishlist.belongsTo(User, { foreignKey: "user_id", as: "user" });
Product.hasMany(Wishlist, { foreignKey: "product_id", as: "wishlists", onDelete: "CASCADE" });
Wishlist.belongsTo(Product, { foreignKey: "product_id", as: "product" });

User.hasMany(ProductLike, { foreignKey: "user_id", as: "productLikes", onDelete: "CASCADE" });
ProductLike.belongsTo(User, { foreignKey: "user_id", as: "user" });
Product.hasMany(ProductLike, { foreignKey: "product_id", as: "likes", onDelete: "CASCADE" });
ProductLike.belongsTo(Product, { foreignKey: "product_id", as: "product" });

User.hasMany(Review, { foreignKey: "user_id", as: "reviews", onDelete: "CASCADE" });
Review.belongsTo(User, { foreignKey: "user_id", as: "user" });
Product.hasMany(Review, { foreignKey: "product_id", as: "reviews", onDelete: "CASCADE" });
Review.belongsTo(Product, { foreignKey: "product_id", as: "product" });

User.hasMany(ActivityLog, { foreignKey: "user_id", as: "activityLogs", onDelete: "SET NULL" });
ActivityLog.belongsTo(User, { foreignKey: "user_id", as: "user" });
Product.hasMany(ActivityLog, { foreignKey: "product_id", as: "activityLogs", onDelete: "SET NULL" });
ActivityLog.belongsTo(Product, { foreignKey: "product_id", as: "product" });

Coupon.hasMany(CouponProduct, { foreignKey: "coupon_id", as: "couponProducts", onDelete: "CASCADE" });
CouponProduct.belongsTo(Coupon, { foreignKey: "coupon_id", as: "coupon" });
CouponProduct.belongsTo(Product, { foreignKey: "product_id", as: "product" });
Product.hasMany(CouponProduct, { foreignKey: "product_id", as: "couponProducts", onDelete: "CASCADE" });

Coupon.hasMany(CouponRedemption, { foreignKey: "coupon_id", as: "redemptions", onDelete: "CASCADE" });
CouponRedemption.belongsTo(Coupon, { foreignKey: "coupon_id", as: "coupon" });
User.hasMany(CouponRedemption, { foreignKey: "user_id", as: "couponRedemptions", onDelete: "CASCADE" });
CouponRedemption.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = {
  User, Product, Category, Wishlist, ProductLike, Review, ActivityLog, Contact,
  Coupon, CouponProduct, CouponRedemption,
};
