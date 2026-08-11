const { Product, ProductLike, User, ActivityLog } = require("../models");

async function logActivity(req, action, productId) {
  try {
    await ActivityLog.create({
      user_id: req.userId,
      product_id: productId,
      action,
      ip_address: req.ip,
      user_agent: req.get("user-agent") || null,
    });
  } catch (e) { console.error("Like activity:", e.message); }
}

exports.toggle = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const userId = Number(req.userId);
    if (!Number.isInteger(productId) || productId <= 0) return res.status(400).json({ success: false, message: "Invalid product ID." });

    const product = await Product.findByPk(productId, { attributes: ["id", "name"] });
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    const existing = await ProductLike.findOne({ where: { product_id: productId, user_id: userId } });
    let liked;
    if (existing) {
      await existing.destroy();
      liked = false;
      await logActivity(req, "LIKE_REMOVE", productId);
    } else {
      await ProductLike.create({ product_id: productId, user_id: userId });
      liked = true;
      await logActivity(req, "LIKE_ADD", productId);
    }

    const likeCount = await ProductLike.count({ where: { product_id: productId } });
    const users = await ProductLike.findAll({
      where: { product_id: productId },
      include: [{ model: User, as: "user", attributes: ["id", "name", "avatar"] }],
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    const io = req.app.get("io");
    if (io) io.to(`product:${productId}`).emit("product:likes", {
      productId, likeCount, liked, users: users.map(x => x.user).filter(Boolean),
    });

    return res.json({ success: true, liked, likeCount, users: users.map(x => x.user).filter(Boolean), message: liked ? "Product liked." : "Like removed." });
  } catch (error) {
    console.error("TOGGLE LIKE:", error);
    if (error.name === "SequelizeUniqueConstraintError") return res.status(409).json({ success: false, message: "You already liked this product." });
    return res.status(500).json({ success: false, message: "Unable to update like." });
  }
};

exports.status = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId <= 0) return res.status(400).json({ success: false, message: "Invalid product ID." });

    const [likeCount, users] = await Promise.all([
      ProductLike.count({ where: { product_id: productId } }),
      ProductLike.findAll({
        where: { product_id: productId },
        include: [{ model: User, as: "user", attributes: ["id", "name", "avatar"] }],
        order: [["createdAt", "DESC"]],
        limit: 10,
      }),
    ]);

    let liked = false;
    if (req.userId) {
      liked = Boolean(await ProductLike.findOne({ where: { product_id: productId, user_id: req.userId } }));
    }

    return res.json({ success: true, liked, likeCount, users: users.map(x => x.user).filter(Boolean) });
  } catch (error) {
    console.error("GET LIKES:", error);
    return res.status(500).json({ success: false, message: "Unable to load likes." });
  }
};

exports.users = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const likes = await ProductLike.findAll({
      where: { product_id: productId },
      include: [{ model: User, as: "user", attributes: ["id", "name", "avatar", ...(req.admin ? ["email"] : [])] }],
      order: [["createdAt", "DESC"]],
    });
    return res.json({ success: true, users: likes.map(x => x.user).filter(Boolean) });
  } catch (error) {
    console.error("GET LIKE USERS:", error);
    return res.status(500).json({ success: false, message: "Unable to load like users." });
  }
};


exports.adminList = async (req, res) => {
  try {
    const { ProductLike, User, Product } = require("../models");
    const rows = await ProductLike.findAll({
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email", "avatar"] },
        { model: Product, as: "product", attributes: ["id", "name", "image"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: Math.min(500, Math.max(1, Number(req.query.limit || 200))),
    });
    return res.json({ success: true, likes: rows });
  } catch (error) {
    console.error("ADMIN LIKES:", error);
    return res.status(500).json({ success: false, message: "Unable to load like tracking." });
  }
};
