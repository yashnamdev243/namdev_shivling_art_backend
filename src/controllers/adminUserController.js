const { Op } = require("sequelize");
const { User, ActivityLog, Product } = require("../models");

exports.listUsers = async (req, res) => {
  try {
    const { search = "", status = "", page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(100, Math.max(1, Number(limit)));
    const safePage = Math.max(1, Number(page));
    const where = { role: "user" };

    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const result = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      limit: safeLimit,
      offset: (safePage - 1) * safeLimit,
    });

    return res.json({ success: true, users: result.rows, total: result.count, page: safePage, totalPages: Math.ceil(result.count / safeLimit) });
  } catch (error) {
    console.error("ADMIN USERS:", error);
    return res.status(500).json({ success: false, message: "Unable to load users." });
  }
};

exports.activity = async (req, res) => {
  try {
    const { userId, productId, action, limit = 100 } = req.query;
    const where = {};
    if (userId) where.user_id = userId;
    if (productId) where.product_id = productId;
    if (action) where.action = action;

    const rows = await ActivityLog.findAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email", "avatar"] },
        { model: Product, as: "product", attributes: ["id", "name", "image"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: Math.min(500, Math.max(1, Number(limit))),
    });

    return res.json({ success: true, activities: rows });
  } catch (error) {
    console.error("ADMIN ACTIVITY:", error);
    return res.status(500).json({ success: false, message: "Unable to load activity." });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, role: "user" } });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const status = req.body.status;
    if (!["active", "inactive"].includes(status)) return res.status(400).json({ success: false, message: "Invalid status." });

    await user.update({ status });
    return res.json({ success: true, message: `User ${status}.`, user: { id: user.id, name: user.name, email: user.email, status: user.status } });
  } catch (error) {
    console.error("ADMIN USER STATUS:", error);
    return res.status(500).json({ success: false, message: "Unable to update user status." });
  }
};
