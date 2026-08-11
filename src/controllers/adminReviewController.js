const { Op } = require("sequelize");
const { Review, User, Product, ActivityLog } = require("../models");

exports.list = async (req, res) => {
  try {
    const { status = "", search = "", page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    const safeLimit = Math.min(100, Math.max(1, Number(limit)));
    const safePage = Math.max(1, Number(page));

    const userWhere = search ? {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ],
    } : undefined;

    const result = await Review.findAndCountAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email", "avatar", "city"], ...(userWhere ? { where: userWhere, required: true } : {}) },
        { model: Product, as: "product", attributes: ["id", "name", "image"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: safeLimit,
      offset: (safePage - 1) * safeLimit,
    });

    return res.json({ success: true, reviews: result.rows, total: result.count, page: safePage, totalPages: Math.ceil(result.count / safeLimit) });
  } catch (error) {
    console.error("ADMIN REVIEWS:", error);
    return res.status(500).json({ success: false, message: "Unable to load reviews." });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });

    const status = String(req.body.status || "");
    if (!["pending", "approved", "rejected"].includes(status)) return res.status(400).json({ success: false, message: "Invalid status." });

    await review.update({ status });
    await ActivityLog.create({
      product_id: review.product_id,
      action: `ADMIN_REVIEW_${status.toUpperCase()}`,
      metadata: { reviewId: review.id, adminEmail: req.admin.email },
      ip_address: req.ip,
      user_agent: req.get("user-agent") || null,
    });

    const io = req.app.get("io");
    const fresh = await Review.findByPk(review.id, {
      include: [{ model: User, as: "user", attributes: ["id", "name", "avatar", "city"] }],
    });
    if (io) io.to(`product:${review.product_id}`).emit("product:review:updated", fresh);

    return res.json({ success: true, message: `Review ${status}.`, review: fresh });
  } catch (error) {
    console.error("ADMIN REVIEW STATUS:", error);
    return res.status(500).json({ success: false, message: "Unable to update review." });
  }
};

exports.approve = (req, res) => { req.body.status = "approved"; return exports.updateStatus(req, res); };
exports.reject = (req, res) => { req.body.status = "rejected"; return exports.updateStatus(req, res); };

exports.feature = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });
    if (review.status !== "approved") return res.status(400).json({ success: false, message: "Only approved reviews can be featured." });
    await review.update({ is_featured: !review.is_featured });
    return res.json({ success: true, message: review.is_featured ? "Review added to testimonials." : "Review removed from testimonials.", is_featured: review.is_featured });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to update featured status." });
  }
};

exports.remove = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });
    await review.destroy();
    const io = req.app.get("io");
    if (io) io.to(`product:${review.product_id}`).emit("product:review:deleted", review.id);
    return res.json({ success: true, message: "Review deleted." });
  } catch (error) {
    console.error("ADMIN REVIEW DELETE:", error);
    return res.status(500).json({ success: false, message: "Unable to delete review." });
  }
};
