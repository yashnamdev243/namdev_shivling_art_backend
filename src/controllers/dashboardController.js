const Product = require("../models/Product");
const Category = require("../models/Category");

exports.getStats = async (req, res) => {
  try {
    const totalProducts = await Product.count();
    const totalCategories = await Category.count();

    const outOfStock = await Product.count({
      where: {
        stock: 0,
      },
    });

    res.json({
      status: true,
      totalProducts,
      totalCategories,
      outOfStock,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};