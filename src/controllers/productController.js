const Product = require("../models/Product");
const { Op, Sequelize } = require("sequelize");

exports.create = async (req, res) => {
  try {
    const slug = req.body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const product = await Product.create({
      product_code: `PRD-${Date.now()}`,
      name: req.body.name,
      slug,
      category: req.body.category,
      short_description: req.body.short_description || "",
      description: req.body.description || "",
      price: req.body.price,
      discount_price: req.body.discount_price || 0,
      stock: req.body.stock || 0,
      image: req.body.image || "",
      gallery: req.body.gallery || [],
      featured: req.body.isFeatured || false,
      status: "active",
      meta_title: req.body.meta_title || req.body.name,
      meta_description: req.body.meta_description || req.body.description,
    });

    res.status(201).json({
      status: true,
      data: product,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};
exports.getAll = async (req, res) => res.json(await Product.findAll());
exports.getOne = async (req, res) =>
  res.json(await Product.findByPk(req.params.id));
exports.update = async (req, res) => {
  const p = await Product.findByPk(req.params.id);

  if (!p) return res.sendStatus(404);

  await p.update({
    ...req.body,
    image: req.file
      ? req.file.filename
      : req.body.image || p.image,
  });

  res.json(p);
};
exports.remove = async (req, res) => {
  const p = await Product.findByPk(req.params.id);
  if (!p) return res.sendStatus(404);
  await p.destroy();
  res.json({ message: "Deleted" });
};

exports.getRandom = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 8;

    const products = await Product.findAll({
      where: {
        image: {
          [Op.ne]: null,
        },
      },
      order: Sequelize.literal("RAND()"),
      limit,
    });

    res.json({
      success: true,
      products,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};