const { Op } = require("sequelize");
const Category = require("../models/Category");

exports.create = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Category name is required." });

    const exists = await Category.findOne({ where: { name } });
    if (exists) return res.status(409).json({ success: false, message: "Category already exists." });

    const slug = name .toLowerCase() .replace(/[^a-z0-9]+/g, "-") .replace(/^-+|-+$/g, "");

    const category = await Category.create({
      name,
      slug,
      description: req.body.description || "",
      image: req.file ? req.file.filename : req.body.image || null,
    });
    return res.status(201).json({ success: true, message: "Category created successfully.", data: category });
  } catch (error) {
    console.error("CREATE CATEGORY:", error);
    return res.status(500).json({ success: false, message: "Unable to create category." });
  }
};

exports.getAll = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const where = {};
    if (req.query.search) where.name = { [Op.like]: `%${String(req.query.search).trim()}%` };

    const result = await Category.findAndCountAll({
      where, limit, offset: (page - 1) * limit, order: [["createdAt", "DESC"]],
    });
    return res.json({ success: true, categories: result.rows, total: result.count, page, totalPages: Math.ceil(result.count / limit) });
  } catch (error) {
    console.error("GET CATEGORIES:", error);
    return res.status(500).json({ success: false, message: "Unable to load categories." });
  }
};

exports.getOne = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found." });
    return res.json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load category." });
  }
};

exports.update = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found." });

    await category.update({
      name: req.body.name,
      description: req.body.description,
      ...(req.file ? { image: req.file.filename } : req.body.image !== undefined ? { image: req.body.image } : {}),
    });
    return res.json({ success: true, message: "Category updated successfully.", data: category });
  } catch (error) {
    console.error("UPDATE CATEGORY:", error);
    return res.status(500).json({ success: false, message: "Unable to update category." });
  }
};

exports.remove = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found." });
    await category.destroy();
    return res.json({ success: true, message: "Category deleted successfully." });
  } catch (error) {
    console.error("DELETE CATEGORY:", error);
    return res.status(500).json({ success: false, message: "Unable to delete category." });
  }
};
