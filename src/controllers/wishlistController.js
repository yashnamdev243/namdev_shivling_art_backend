const { Wishlist, Product, User, ActivityLog } = require("../models");

async function activity(req, action, productId) {
  try {
    await ActivityLog.create({
      user_id: req.userId,
      product_id: productId,
      action,
      ip_address: req.ip,
      user_agent: req.get("user-agent") || null,
    });
  } catch (e) { console.error("Wishlist activity:", e.message); }
}

exports.list = async (req, res) => {
  try {
    const rows = await Wishlist.findAll({
      where: { user_id: req.userId },
      include: [{ model: Product, as: "product" }],
      order: [["createdAt", "DESC"]],
    });
    return res.json({ success: true, items: rows.map(row => row.product).filter(Boolean), count: rows.length });
  } catch (error) {
    console.error("GET WISHLIST:", error);
    return res.status(500).json({ success: false, message: "Unable to load wishlist." });
  }
};

exports.toggle = async (req, res) => {
  try {
    const userId = Number(req.userId);
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId <= 0) return res.status(400).json({ success: false, message: "Invalid product ID." });

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    const existing = await Wishlist.findOne({ where: { user_id: userId, product_id: productId } });
    if (existing) {
      await existing.destroy();
      await activity(req, "WISHLIST_REMOVE", productId);
      const count = await Wishlist.count({ where: { product_id: productId } });
      return res.json({ success: true, wishlisted: false, productId, wishlistCount: count, message: "Removed from wishlist." });
    }

    await Wishlist.create({ user_id: userId, product_id: productId });
    await activity(req, "WISHLIST_ADD", productId);
    const count = await Wishlist.count({ where: { product_id: productId } });
    return res.status(201).json({ success: true, wishlisted: true, productId, wishlistCount: count, product, message: "Added to wishlist." });
  } catch (error) {
    console.error("TOGGLE WISHLIST:", error);
    if (error.name === "SequelizeUniqueConstraintError") return res.status(409).json({ success: false, message: "Product is already in your wishlist." });
    return res.status(500).json({ success: false, message: "Unable to update wishlist." });
  }
};

exports.remove = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const result = await Wishlist.destroy({ where: { user_id: req.userId, product_id: productId } });
    if (result) await activity(req, "WISHLIST_REMOVE", productId);
    return res.json({ success: true, removed: Boolean(result), productId, message: result ? "Removed from wishlist." : "Product was not in your wishlist." });
  } catch (error) {
    console.error("REMOVE WISHLIST:", error);
    return res.status(500).json({ success: false, message: "Unable to remove wishlist item." });
  }
};

exports.adminList = async (req, res) => {
  try {
    const rows = await Wishlist.findAll({
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email", "avatar"] },
        { model: Product, as: "product", attributes: ["id", "name", "image", "price", "discount_price"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: Math.min(500, Math.max(1, Number(req.query.limit || 100))),
    });
    return res.json({ success: true, wishlists: rows });
  } catch (error) {
    console.error("ADMIN WISHLISTS:", error);
    return res.status(500).json({ success: false, message: "Unable to load wishlist tracking." });
  }
};
