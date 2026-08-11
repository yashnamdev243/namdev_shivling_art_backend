const { Op } = require("sequelize");
const { Coupon, CouponProduct, CouponRedemption, Product, User, ActivityLog } = require("../models");
const sequelize = require("../config/database");

function money(value) {
  return Math.max(0, Number(Number(value || 0).toFixed(2)));
}

async function findCoupon(code, now = new Date()) {
  const coupon = await Coupon.findOne({
    where: {
      code: String(code || "").trim().toUpperCase(),
      is_active: true,
      [Op.and]: [
        { [Op.or]: [{ starts_at: null }, { starts_at: { [Op.lte]: now } }] },
        { [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gte]: now } }] },
      ],
    },
  });
  return coupon;
}

async function usageCount(couponId) {
  return CouponRedemption.count({ where: { coupon_id: couponId } });
}

async function userUsageCount(couponId, userId) {
  return CouponRedemption.count({ where: { coupon_id: couponId, user_id: userId } });
}

async function applicableProductIds(couponId) {
  const rows = await CouponProduct.findAll({ where: { coupon_id: couponId }, attributes: ["product_id"] });
  return rows.map(r => Number(r.product_id));
}

async function calculate(coupon, userId, items) {
  if (!userId) throw Object.assign(new Error("Login is required to use a coupon."), { status: 401 });

  const usedByUser = await userUsageCount(coupon.id, userId);
  if (coupon.per_user_limit && usedByUser >= coupon.per_user_limit) {
    throw Object.assign(new Error("You have already used this coupon the maximum number of times."), { status: 400 });
  }

  const totalUsed = await usageCount(coupon.id);
  if (coupon.usage_limit && totalUsed >= coupon.usage_limit) {
    throw Object.assign(new Error("This coupon has reached its usage limit."), { status: 400 });
  }

  const normalized = Array.isArray(items) ? items : [];
  const productIds = normalized.map(i => Number(i.productId || i.id)).filter(Boolean);
  const dbProducts = productIds.length ? await Product.findAll({ where: { id: productIds, status: "active" } }) : [];
  const map = new Map(dbProducts.map(p => [Number(p.id), p]));

  const allowedIds = await applicableProductIds(coupon.id);
  const allowedSet = new Set(allowedIds);
  const scoped = coupon.applies_to_all
    ? dbProducts
    : dbProducts.filter(p => allowedSet.has(Number(p.id)));

  const quantityMap = new Map(normalized.map(i => [Number(i.productId || i.id), Math.max(1, Number(i.quantity || 1))]));
  const eligibleSubtotal = money(scoped.reduce((sum, p) => {
    const unit = Number(p.discount_price) > 0 ? Number(p.discount_price) : Number(p.price);
    return sum + unit * (quantityMap.get(Number(p.id)) || 1);
  }, 0));

  const fullSubtotal = money(dbProducts.reduce((sum, p) => {
    const unit = Number(p.discount_price) > 0 ? Number(p.discount_price) : Number(p.price);
    return sum + unit * (quantityMap.get(Number(p.id)) || 1);
  }, 0));

  if (eligibleSubtotal <= 0) throw Object.assign(new Error("This coupon does not apply to the selected products."), { status: 400 });
  if (fullSubtotal < Number(coupon.min_order_amount)) {
    throw Object.assign(new Error(`Minimum order value for this coupon is ₹${money(coupon.min_order_amount)}.`), { status: 400 });
  }

  let discount = coupon.discount_type === "percentage"
    ? eligibleSubtotal * (Number(coupon.discount_value) / 100)
    : Number(coupon.discount_value);

  if (coupon.max_discount !== null && coupon.max_discount !== undefined) {
    discount = Math.min(discount, Number(coupon.max_discount));
  }
  discount = Math.min(money(discount), eligibleSubtotal);

  return {
    couponId: coupon.id,
    code: coupon.code,
    discountType: coupon.discount_type,
    discountValue: Number(coupon.discount_value),
    eligibleSubtotal,
    orderSubtotal: fullSubtotal,
    discountAmount: discount,
    payableAmount: money(fullSubtotal - discount),
    message: `Coupon ${coupon.code} applied successfully.`,
  };
}

exports.active = async (_req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.findAll({
      where: {
        is_active: true,
        [Op.and]: [
          { [Op.or]: [{ starts_at: null }, { starts_at: { [Op.lte]: now } }] },
          { [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gte]: now } }] },
        ],
      },
      attributes: ["id", "code", "title", "description", "discount_type", "discount_value", "max_discount", "min_order_amount", "expires_at", "festival_name"],
      order: [["createdAt", "DESC"]],
    });
    return res.json({ success: true, coupons });
  } catch (error) {
    console.error("ACTIVE COUPONS:", error);
    return res.status(500).json({ success: false, message: "Unable to load active offers." });
  }
};

exports.validate = async (req, res) => {
  try {
    const coupon = await findCoupon(req.body.code);
    if (!coupon) return res.status(404).json({ success: false, message: "Invalid, inactive, or expired coupon code." });

    const result = await calculate(coupon, req.userId, req.body.items);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("VALIDATE COUPON:", error);
    return res.status(error.status || 500).json({ success: false, message: error.message || "Unable to apply coupon." });
  }
};

exports.redeem = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { code, orderReference, items } = req.body;
    if (!orderReference || String(orderReference).length < 3) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "A valid order reference is required." });
    }

    const coupon = await findCoupon(code);
    if (!coupon) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Invalid, inactive, or expired coupon code." });
    }

    const existing = await CouponRedemption.findOne({ where: { order_reference: orderReference } });
    if (existing) {
      await transaction.rollback();
      return res.status(409).json({ success: false, message: "This order reference has already used a coupon." });
    }

    const result = await calculate(coupon, req.userId, items);
    const redemption = await CouponRedemption.create({
      coupon_id: coupon.id,
      user_id: req.userId,
      order_reference: String(orderReference).trim(),
      order_amount: result.orderSubtotal,
      discount_amount: result.discountAmount,
    }, { transaction });

    await ActivityLog.create({
      user_id: req.userId,
      action: "COUPON_REDEEM",
      metadata: { couponId: coupon.id, code: coupon.code, orderReference, discountAmount: result.discountAmount },
      ip_address: req.ip,
      user_agent: req.get("user-agent") || null,
    }, { transaction });

    await transaction.commit();
    return res.status(201).json({ success: true, message: `Coupon ${coupon.code} redeemed.`, redemption });
  } catch (error) {
    await transaction.rollback();
    console.error("REDEEM COUPON:", error);
    return res.status(error.status || 500).json({ success: false, message: error.message || "Unable to redeem coupon." });
  }
};

exports.adminList = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({
      include: [{ model: CouponProduct, as: "couponProducts", include: [{ model: Product, as: "product", attributes: ["id", "name", "image"] }] }],
      order: [["createdAt", "DESC"]],
    });
    return res.json({ success: true, coupons });
  } catch (error) {
    console.error("ADMIN COUPONS:", error);
    return res.status(500).json({ success: false, message: "Unable to load coupons." });
  }
};

exports.adminCreate = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const body = req.body;
    const code = String(body.code || "").trim().toUpperCase();
    if (!code) throw Object.assign(new Error("Coupon code is required."), { status: 400 });

    const existing = await Coupon.findOne({ where: { code } });
    if (existing) throw Object.assign(new Error("Coupon code already exists."), { status: 409 });

    const discountType = body.discount_type === "fixed" ? "fixed" : "percentage";
    const value = Number(body.discount_value);
    if (!Number.isFinite(value) || value <= 0 || (discountType === "percentage" && value > 100)) {
      throw Object.assign(new Error("Invalid discount value."), { status: 400 });
    }

    const coupon = await Coupon.create({
      code,
      title: body.title || null,
      description: body.description || null,
      discount_type: discountType,
      discount_value: value,
      max_discount: body.max_discount === "" || body.max_discount == null ? null : Number(body.max_discount),
      min_order_amount: Number(body.min_order_amount || 0),
      usage_limit: body.usage_limit === "" || body.usage_limit == null ? null : Number(body.usage_limit),
      per_user_limit: Number(body.per_user_limit || 1),
      starts_at: body.starts_at || null,
      expires_at: body.expires_at || null,
      is_active: body.is_active !== false,
      festival_name: body.festival_name || null,
      applies_to_all: body.applies_to_all !== false,
    }, { transaction });

    const productIds = Array.isArray(body.product_ids) ? [...new Set(body.product_ids.map(Number).filter(Boolean))] : [];
    if (!coupon.applies_to_all && productIds.length === 0) {
      throw Object.assign(new Error("Select at least one product for a product-specific coupon."), { status: 400 });
    }
    if (productIds.length) {
      const products = await Product.findAll({ where: { id: productIds }, attributes: ["id"], transaction });
      if (products.length !== productIds.length) throw Object.assign(new Error("One or more selected products do not exist."), { status: 400 });
      await CouponProduct.bulkCreate(productIds.map(product_id => ({ coupon_id: coupon.id, product_id })), { transaction });
    }

    await transaction.commit();
    return res.status(201).json({ success: true, message: "Coupon created successfully.", coupon });
  } catch (error) {
    await transaction.rollback();
    console.error("ADMIN CREATE COUPON:", error);
    return res.status(error.status || 500).json({ success: false, message: error.message || "Unable to create coupon." });
  }
};

exports.adminUpdate = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) throw Object.assign(new Error("Coupon not found."), { status: 404 });

    const body = req.body;
    const updates = {};
    for (const key of ["title", "description", "discount_type", "discount_value", "max_discount", "min_order_amount", "usage_limit", "per_user_limit", "starts_at", "expires_at", "is_active", "festival_name", "applies_to_all"]) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (body.code !== undefined) updates.code = String(body.code).trim().toUpperCase();

    await coupon.update(updates, { transaction });

    if (Array.isArray(body.product_ids)) {
      await CouponProduct.destroy({ where: { coupon_id: coupon.id }, transaction });
      if (!coupon.applies_to_all) {
        const ids = [...new Set(body.product_ids.map(Number).filter(Boolean))];
        if (ids.length) await CouponProduct.bulkCreate(ids.map(product_id => ({ coupon_id: coupon.id, product_id })), { transaction });
      }
    }

    await transaction.commit();
    return res.json({ success: true, message: "Coupon updated successfully.", coupon });
  } catch (error) {
    await transaction.rollback();
    console.error("ADMIN UPDATE COUPON:", error);
    return res.status(error.status || 500).json({ success: false, message: error.message || "Unable to update coupon." });
  }
};

exports.adminDelete = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found." });
    await coupon.destroy();
    return res.json({ success: true, message: "Coupon deleted." });
  } catch (error) {
    console.error("ADMIN DELETE COUPON:", error);
    return res.status(500).json({ success: false, message: "Unable to delete coupon." });
  }
};

exports.adminRedemptions = async (req, res) => {
  try {
    const rows = await CouponRedemption.findAll({
      include: [
        { model: Coupon, as: "coupon", attributes: ["id", "code", "title"] },
        { model: User, as: "user", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 500,
    });
    return res.json({ success: true, redemptions: rows });
  } catch (error) {
    console.error("ADMIN REDEMPTIONS:", error);
    return res.status(500).json({ success: false, message: "Unable to load coupon usage." });
  }
};
