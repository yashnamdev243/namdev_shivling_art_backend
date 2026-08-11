const { Op, Sequelize } = require("sequelize");
const { Product, ProductLike, Wishlist, Review, User } = require("../models");

function safeNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseJsonField(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

exports.create = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Product name is required." });

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const slug = `${baseSlug || "product"}-${Date.now()}`;

    const product = await Product.create({
      product_code: req.body.product_code || `PRD-${Date.now()}`,
      name,
      slug,
      category: req.body.category || null,
      short_description: req.body.short_description || "",
      description: req.body.description || "",
      price: safeNumber(req.body.price, 0),
      discount_price: safeNumber(req.body.discount_price, 0),
      stock: safeNumber(req.body.stock, 0),
      image: req.file ? req.file.filename : req.body.image || "",
      gallery: parseJsonField(req.body.gallery, []),
      video: req.body.video || null,
      highlights: parseJsonField(req.body.highlights, []),
      featured: req.body.isFeatured === true || req.body.featured === true || req.body.featured === "true",
      status: req.body.status === "inactive" ? "inactive" : "active",
      meta_title: req.body.meta_title || name,
      meta_description: req.body.meta_description || req.body.description || "",
    });

    return res.status(201).json({ success: true, message: "Product created successfully.", product });
  } catch (error) {
    console.error("CREATE PRODUCT:", error);
    if (error.name === "SequelizeUniqueConstraintError") return res.status(409).json({ success: false, message: "Product code or slug already exists." });
    return res.status(500).json({ success: false, message: "Unable to create product." });
  }
};

exports.getAll = async (req, res) => {
  try {
    const page = Math.max(1, safeNumber(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, safeNumber(req.query.limit, 20)));
    const { search = "", category = "", sort = "-createdAt" } = req.query;
    const where = { status: "active" };

    if (search) where.name = { [Op.like]: `%${String(search).trim()}%` };
    if (category) where.category = category;

    const allowedSorts = ["createdAt", "price", "name", "stock"];
    const isDesc = String(sort).startsWith("-");
    const requestedField = isDesc ? String(sort).slice(1) : String(sort);
    const field = allowedSorts.includes(requestedField) ? requestedField : "createdAt";

    const result = await Product.findAndCountAll({
      where,
      order: [[field, isDesc ? "DESC" : "ASC"]],
      limit,
      offset: (page - 1) * limit,
    });

    return res.json({ success: true, products: result.rows, total: result.count, page, totalPages: Math.ceil(result.count / limit) });
  } catch (error) {
    console.error("GET PRODUCTS:", error);
    return res.status(500).json({ success: false, message: "Unable to load products." });
  }
};

exports.getOne = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    const [likes, wishlist, reviews] = await Promise.all([
      ProductLike.count({ where: { product_id: product.id } }),
      Wishlist.count({ where: { product_id: product.id } }),
      Review.findAll({ where: { product_id: product.id, status: "approved" }, attributes: ["rating"] }),
    ]);

    const ratings = reviews.map(r => Number(r.rating)).filter(Number.isFinite);
    const rating = ratings.length ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 0;

    return res.json({
      success: true,
      product: product.toJSON(),
      stats: { likes, wishlist, reviews: reviews.length, rating },
    });
  } catch (error) {
    console.error("GET PRODUCT:", error);
    return res.status(500).json({ success: false, message: "Unable to load product." });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    const updates = { ...req.body };
    delete updates.id;
    delete updates.slug;
    if (req.file) updates.image = req.file.filename;
    if ("gallery" in updates) updates.gallery = parseJsonField(updates.gallery, product.gallery || []);
    if ("highlights" in updates) updates.highlights = parseJsonField(updates.highlights, product.highlights || []);
    if ("price" in updates) updates.price = safeNumber(updates.price, Number(product.price));
    if ("discount_price" in updates) updates.discount_price = safeNumber(updates.discount_price, Number(product.discount_price));
    if ("stock" in updates) updates.stock = safeNumber(updates.stock, Number(product.stock));
    if (typeof updates.featured === "string") updates.featured = updates.featured === "true";
    if (typeof updates.status === "string" && !["active", "inactive"].includes(updates.status)) delete updates.status;

    await product.update(updates);
    return res.json({ success: true, message: "Product updated successfully.", product });
  } catch (error) {
    console.error("UPDATE PRODUCT:", error);
    return res.status(500).json({ success: false, message: "Unable to update product." });
  }
};

exports.remove = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    await product.destroy();
    return res.json({ success: true, message: "Product deleted successfully." });
  } catch (error) {
    console.error("DELETE PRODUCT:", error);
    return res.status(500).json({ success: false, message: "Unable to delete product." });
  }
};

exports.getRandom = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, safeNumber(req.query.limit, 8)));
    const products = await Product.findAll({
      where: { status: "active" },
      order: Sequelize.literal("RAND()"),
      limit,
    });
    return res.json({ success: true, products });
  } catch (error) {
    console.error("GET RANDOM PRODUCTS:", error);
    return res.status(500).json({ success: false, message: "Unable to load products." });
  }
};
