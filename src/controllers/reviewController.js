const { Review, User, Product, ActivityLog } = require("../models");

async function logActivity(req, action, productId, metadata = {}) {
  try {
    await ActivityLog.create({
      user_id: req.userId || null,
      product_id: productId || null,
      action,
      metadata,
      ip_address: req.ip,
      user_agent: req.get("user-agent") || null,
    });
  } catch (e) {
    console.error("Review activity:", e.message);
  }
}

function reviewPayload(review) {
  return {
    id: review.id,
    product_id: review.product_id,
    user_id: review.user_id,
    rating: Number(review.rating),
    comment: review.comment,
    status: review.status,
    is_featured: Boolean(review.is_featured),
    createdAt: review.createdAt,
    user: review.user
      ? {
          id: review.user.id,
          name: review.user.name,
          avatar: review.user.avatar,
          city: review.user.city,
        }
      : null,
  };
}

exports.listByProduct = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID." });

    const reviews = await Review.findAll({
      where: { product_id: productId, status: "approved" },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "avatar", "city"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const rating = reviews.length
      ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
      : 0;
    return res.json({
      success: true,
      reviews: reviews.map(reviewPayload),
      stats: { count: reviews.length, rating: Number(rating.toFixed(1)) },
    });
  } catch (error) {
    console.error("LIST REVIEWS:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load reviews." });
  }
};

exports.create = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const userId = Number(req.userId);
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").trim();

    if (!Number.isInteger(productId) || productId <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID." });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5." });
    if (comment.length < 3)
      return res
        .status(400)
        .json({
          success: false,
          message: "Review must contain at least 3 characters.",
        });
    if (comment.length > 2000)
      return res
        .status(400)
        .json({ success: false, message: "Review is too long." });

    const product = await Product.findByPk(productId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });

    const existing = await Review.findOne({
      where: { product_id: productId, user_id: userId },
    });
    if (existing)
      return res
        .status(409)
        .json({
          success: false,
          message: "You have already reviewed this product.",
        });

    const review = await Review.create({
      product_id: productId,
      user_id: userId,
      rating,
      comment,
      status: "approved",
    });

    const created = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "avatar", "city"],
        },
      ],
    });

    const payload = reviewPayload(created);
    await logActivity(req, "REVIEW_CREATE", productId, {
      reviewId: review.id,
      rating,
    });
    const io = req.app.get("io");
    if (io) {
      io.to(`product:${productId}`).emit("product:review:new", payload);
      io.emit("review:created", payload);
    }

    return res
      .status(201)
      .json({
        success: true,
        message: "Review published successfully.",
        review: payload,
      });
  } catch (error) {
    console.error("CREATE REVIEW:", error);
    if (error.name === "SequelizeUniqueConstraintError")
      return res
        .status(409)
        .json({
          success: false,
          message: "You have already reviewed this product.",
        });
    return res
      .status(500)
      .json({ success: false, message: "Unable to submit review." });
  }
};

exports.testimonials = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { status: "approved", is_featured: true },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "avatar", "city"],
        },
        { model: Product, as: "product", attributes: ["id", "name", "image"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 20,
    });
    const fallback = reviews.length
      ? reviews
      : await Review.findAll({
          where: { status: "approved" },
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "avatar", "city"],
            },
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image"],
            },
          ],
          order: [["createdAt", "DESC"]],
          limit: 20,
        });
    return res.json({
      success: true,
      testimonials: fallback.map((r) => ({
        id: r.id,
        name: r.user?.name || "Customer",
        review: r.comment,
        rating: Number(r.rating),
        avatar: r.user?.avatar || null,
        city: r.user?.city || null,
        product: r.product
          ? { id: r.product.id, name: r.product.name, image: r.product.image }
          : null,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("TESTIMONIALS:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load testimonials." });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found." });

    const status = String(req.body.status || "");
    if (!["pending", "approved", "rejected"].includes(status))
      return res
        .status(400)
        .json({ success: false, message: "Invalid review status." });

    await review.update({ status });
    const updated = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "avatar", "city"],
        },
      ],
    });
    const payload = reviewPayload(updated);
    const io = req.app.get("io");
    if (io) {
      io.to(`product:${review.product_id}`).emit(
        "product:review:updated",
        payload,
      );
      io.emit("review:updated", payload);
    }
    return res.json({
      success: true,
      message: `Review ${status}.`,
      review: payload,
    });
  } catch (error) {
    console.error("UPDATE REVIEW:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to update review status." });
  }
};

exports.feature = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found." });
    if (review.status !== "approved")
      return res
        .status(400)
        .json({
          success: false,
          message: "Only approved reviews can be featured.",
        });
    await review.update({ is_featured: !review.is_featured });
    return res.json({
      success: true,
      message: review.is_featured
        ? "Review featured."
        : "Review removed from testimonials.",
      is_featured: review.is_featured,
    });
  } catch (error) {
    console.error("FEATURE REVIEW:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to update featured status." });
  }
};

exports.remove = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found." });
    await review.destroy();
    const io = req.app.get("io");
    if (io)
      io.to(`product:${review.product_id}`).emit(
        "product:review:deleted",
        review.id,
      );
    return res.json({ success: true, message: "Review deleted successfully." });
  } catch (error) {
    console.error("DELETE REVIEW:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to delete review." });
  }
};
