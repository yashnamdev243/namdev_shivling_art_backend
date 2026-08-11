const { Product, Category, User, Review, ProductLike, Wishlist, CouponRedemption } = require("../models");

exports.getStats = async (_req, res) => {
  try {
    const [totalProducts, totalCategories, outOfStock, totalUsers, totalReviews, totalLikes, totalWishlists, totalCouponUses] = await Promise.all([
      Product.count(),
      Category.count(),
      Product.count({ where: { stock: 0 } }),
      User.count({ where: { role: "user" } }),
      Review.count(),
      ProductLike.count(),
      Wishlist.count(),
      CouponRedemption.count(),
    ]);

    return res.json({
      success: true,
      totalProducts, totalCategories, outOfStock,
      totalUsers, totalReviews, totalLikes, totalWishlists, totalCouponUses,
    });
  } catch (error) {
    console.error("DASHBOARD STATS:", error);
    return res.status(500).json({ success: false, message: "Unable to load dashboard statistics." });
  }
};
