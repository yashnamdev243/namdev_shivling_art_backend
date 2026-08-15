const { Op } = require("sequelize");
const { ActivityLog } = require("../models");
const Coupon = require("../models/Coupon");
const Product = require("../models/Product");
const User = require("../models/User");
const CouponRedemption = require("../models/CouponRedemption");

let CouponProduct = null;

try {
  CouponProduct = require("../models/CouponProduct");
} catch (error) {
  console.warn(
    "CouponProduct model not found. Product-specific coupon support will be limited."
  );
}

/* =========================================================
   HELPERS
========================================================= */

function money(value) {
  return Math.max(
    0,
    Number(Number(value || 0).toFixed(2))
  );
}

function normalizeCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase();
}

function toArray(value) {
  if (Array.isArray(value)) return value;

  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* =========================================================
   FIND ACTIVE COUPON
========================================================= */

// async function findActiveCoupon(code) {
//   const now = new Date();

//   return Coupon.findOne({
//     where: {
//       code: normalizeCode(code),

//       is_active: true,

//       [Op.and]: [
//         {
//           [Op.or]: [
//             { starts_at: null },
//             {
//               starts_at: {
//                 [Op.lte]: now,
//               },
//             },
//           ],
//         },

//         {
//           [Op.or]: [
//             { expires_at: null },
//             {
//               expires_at: {
//                 [Op.gte]: now,
//               },
//             },
//           ],
//         },
//       ],
//     },
//   });
// }

async function findCouponByCode(code) {
  return Coupon.findOne({ where: { code: normalizeCode(code) } });
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* =========================================================
   GET PRODUCT IDS FOR COUPON
========================================================= */

async function getCouponProductIds(couponId) {
  if (!CouponProduct) {
    return [];
  }

  const rows = await CouponProduct.findAll({
    where: {
      coupon_id: couponId,
    },

    attributes: ["product_id"],
  });

  return rows.map((row) => Number(row.product_id));
}

/* =========================================================
   CHECK COUPON FOR PRODUCT
========================================================= */

// async function validateCouponForProduct(code, product) {
//   const coupon = await findActiveCoupon(code);

//   if (!coupon) {
//     return {
//       valid: false,
//       message: "Invalid, inactive, or expired coupon code.",
//     };
//   }

//   const now = new Date();

//   if (
//     coupon.starts_at &&
//     now < new Date(coupon.starts_at)
//   ) {
//     return {
//       valid: false,
//       message: "This coupon is not active yet.",
//     };
//   }

//   if (
//     coupon.expires_at &&
//     now > new Date(coupon.expires_at)
//   ) {
//     return {
//       valid: false,
//       message: "This coupon has expired.",
//     };
//   }

//   const price = Number(
//     product.discount_price > 0
//       ? product.discount_price
//       : product.price
//   );

//   if (!Number.isFinite(price) || price <= 0) {
//     return {
//       valid: false,
//       message: "Invalid product price.",
//     };
//   }

//   /* =====================================================
//      MINIMUM ORDER AMOUNT
//   ===================================================== */

//   if (
//     Number(coupon.min_order_amount) > 0 &&
//     price < Number(coupon.min_order_amount)
//   ) {
//     return {
//       valid: false,

//       message: `Minimum order amount is ₹${Number(
//         coupon.min_order_amount
//       ).toLocaleString("en-IN")}.`,
//     };
//   }

//   /* =====================================================
//      PRODUCT APPLICABILITY
//   ===================================================== */

//   if (!coupon.applies_to_all) {
//     const allowedProductIds =
//       await getCouponProductIds(coupon.id);

//     if (allowedProductIds.length === 0) {
//       return {
//         valid: false,
//         message: "This coupon has no products assigned.",
//       };
//     }

//     const productId = Number(product.id);

//     if (!allowedProductIds.includes(productId)) {
//       return {
//         valid: false,

//         message:
//           "This coupon is not applicable to this product.",
//       };
//     }
//   }

//   /* =====================================================
//      CALCULATE DISCOUNT
//   ===================================================== */

//   let discount = 0;

//   if (coupon.discount_type === "percentage") {
//     discount =
//       price *
//       (Number(coupon.discount_value) / 100);
//   } else {
//     discount = Number(coupon.discount_value);
//   }

//   /* Maximum discount */

//   if (
//     coupon.max_discount !== null &&
//     coupon.max_discount !== undefined
//   ) {
//     discount = Math.min(
//       discount,
//       Number(coupon.max_discount)
//     );
//   }

//   discount = Math.min(
//     money(discount),
//     price
//   );

//   const finalPrice = money(
//     price - discount
//   );

//   return {
//     valid: true,

//     coupon,

//     originalPrice: money(price),

//     discount: money(discount),

//     finalPrice,
//   };
// }


async function validateCouponForProduct(code, product, userId) {
  const coupon = await findCouponByCode(code);

  if (!coupon) {
    return { valid: false, code: "NOT_FOUND", message: "We couldn't find a coupon with that code. Please check and try again." };
  }

  if (!coupon.is_active) {
    return { valid: false, code: "INACTIVE", message: "This coupon is no longer active." };
  }

  const now = new Date();

  if (coupon.starts_at && now < new Date(coupon.starts_at)) {
    return { valid: false, code: "NOT_STARTED", message: `This coupon isn't live yet. It starts on ${formatDate(coupon.starts_at)}.` };
  }

  if (coupon.expires_at && now > new Date(coupon.expires_at)) {
    return { valid: false, code: "EXPIRED", message: `This coupon expired on ${formatDate(coupon.expires_at)}.` };
  }

  const price = Number(product.discount_price > 0 ? product.discount_price : product.price);
  if (!Number.isFinite(price) || price <= 0) {
    return { valid: false, code: "INVALID_PRICE", message: "This product can't be used with a coupon right now." };
  }

  if (Number(coupon.min_order_amount) > 0 && price < Number(coupon.min_order_amount)) {
    const shortfall = Number(coupon.min_order_amount) - price;
    return {
      valid: false,
      code: "MIN_ORDER_NOT_MET",
      message: `Add ₹${shortfall.toLocaleString("en-IN")} more to your order to use this coupon (minimum ₹${Number(coupon.min_order_amount).toLocaleString("en-IN")}).`,
    };
  }

  if (!coupon.applies_to_all) {
    const allowedProductIds = await getCouponProductIds(coupon.id);
    if (allowedProductIds.length === 0) {
      return { valid: false, code: "NO_PRODUCTS", message: "This coupon isn't linked to any products yet." };
    }
    if (!allowedProductIds.includes(Number(product.id))) {
      return { valid: false, code: "PRODUCT_NOT_ELIGIBLE", message: "This coupon isn't valid for this product." };
    }
  }

  /* Total usage cap */
  if (coupon.usage_limit) {
    const totalUsed = await CouponRedemption.count({ where: { coupon_id: coupon.id } });
    if (totalUsed >= coupon.usage_limit) {
      return { valid: false, code: "USAGE_LIMIT_REACHED", message: "This coupon has reached its usage limit and is no longer available." };
    }
  }

  /* Per-user cap — this is what gives you "already applied" */
  if (userId) {
    const usedByUser = await CouponRedemption.count({ where: { coupon_id: coupon.id, user_id: userId } });
    const limit = coupon.per_user_limit || 1;
    if (usedByUser >= limit) {
      return {
        valid: false,
        code: "ALREADY_USED",
        message: limit > 1
          ? `You've already used this coupon the maximum number of times (${limit}).`
          : "You've already used this coupon.",
      };
    }
  }

  let discount = 0;
  if (coupon.discount_type === "percentage") {
    discount = price * (Number(coupon.discount_value) / 100);
  } else {
    discount = Number(coupon.discount_value);
  }
  if (coupon.max_discount !== null && coupon.max_discount !== undefined) {
    discount = Math.min(discount, Number(coupon.max_discount));
  }
  discount = Math.min(money(discount), price);
  const finalPrice = money(price - discount);

  return { valid: true, coupon, originalPrice: money(price), discount: money(discount), finalPrice };
}

/* =========================================================
   CUSTOMER
   POST /api/coupons/apply
========================================================= */

// exports.apply = async (req, res) => {
//   try {
//     const code = normalizeCode(
//       req.body.code
//     );

//     const productId =
//       req.body.productId;

//     if (!code) {
//       return res.status(400).json({
//         success: false,
//         message: "Coupon code is required.",
//       });
//     }

//     if (!productId) {
//       return res.status(400).json({
//         success: false,
//         message: "Product ID is required.",
//       });
//     }

//     const product =
//       await Product.findByPk(productId);

//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found.",
//       });
//     }

//     const result =
//       await validateCouponForProduct(
//         code,
//         product
//       );

//     if (!result.valid) {
//       return res.status(400).json({
//         success: false,
//         message: result.message,
//       });
//     }

//     return res.json({
//       success: true,

//       message:
//         "Coupon applied successfully.",

//       coupon: {
//         id: result.coupon.id,
//         code: result.coupon.code,
//         title: result.coupon.title,
//         description:
//           result.coupon.description,

//         discount_type:
//           result.coupon.discount_type,

//         discount_value:
//           Number(
//             result.coupon.discount_value
//           ),

//         min_order_amount:
//           Number(
//             result.coupon.min_order_amount
//           ),

//         max_discount:
//           result.coupon.max_discount !== null
//             ? Number(
//                 result.coupon.max_discount
//               )
//             : null,
//       },

//       pricing: {
//         originalPrice:
//           result.originalPrice,

//         discount:
//           result.discount,

//         finalPrice:
//           result.finalPrice,
//       },
//     });
//   } catch (error) {
//     console.error(
//       "APPLY COUPON ERROR:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: "Unable to apply coupon.",
//     });
//   }
// };

exports.apply = async (req, res) => {
  try {
    const code = normalizeCode(req.body.code);
    const productId = req.body.productId;
    const userId = req.user?.id; // set by requireUser middleware

    if (!code) return res.status(400).json({ success: false, message: "Please enter a coupon code." });
    if (!productId) return res.status(400).json({ success: false, message: "Product ID is required." });

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    const result = await validateCouponForProduct(code, product, userId);

    if (!result.valid) {
      return res.status(400).json({ success: false, code: result.code, message: result.message });
    }

    // Record the redemption so it shows up in admin tracking AND the user's own history
    if (userId) {
      try {
        await CouponRedemption.create({
          coupon_id: result.coupon.id,
          user_id: userId,
          order_reference: `APPLY-${product.id}-${userId}-${Date.now()}`,
          order_amount: result.originalPrice,
          discount_amount: result.discount,
        });
         await ActivityLog.create({
            user_id: userId,
            product_id: product.id,
            action: "COUPON_APPLY",
            metadata: { code: result.coupon.code, discount: result.discount, finalPrice: result.finalPrice },
            ip_address: req.ip,
            user_agent: req.get("user-agent") || null,
          });
      } catch (logError) {
        console.error("COUPON REDEMPTION LOG ERROR:", logError);
        // don't fail the apply just because logging failed
      }
    }

    return res.json({
      success: true,
      message: "Coupon applied successfully! Your discount has been added.",
      coupon: {
        id: result.coupon.id,
        code: result.coupon.code,
        title: result.coupon.title,
        description: result.coupon.description,
        discount_type: result.coupon.discount_type,
        discount_value: Number(result.coupon.discount_value),
        min_order_amount: Number(result.coupon.min_order_amount),
        max_discount: result.coupon.max_discount !== null ? Number(result.coupon.max_discount) : null,
      },
      pricing: { originalPrice: result.originalPrice, discount: result.discount, finalPrice: result.finalPrice },
    });
  } catch (error) {
    console.error("APPLY COUPON ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to apply coupon." });
  }
};

/* User's own coupon usage history */
exports.myRedemptions = async (req, res) => {
  try {
    const redemptions = await CouponRedemption.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Coupon, as: "coupon", attributes: ["id", "code", "title", "discount_type", "discount_value"] }],
      order: [["createdAt", "DESC"]],
      limit: 100,
    });
    return res.json({ success: true, redemptions });
  } catch (error) {
    console.error("MY COUPON REDEMPTIONS ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load your coupon history." });
  }
};

/* Admin: all redemptions across all users */
exports.adminRedemptions = async (req, res) => {
  try {
    const redemptions = await CouponRedemption.findAll({
      include: [
        { model: Coupon, as: "coupon", attributes: ["id", "code", "title"] },
        { model: User, as: "user", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 500,
    });
    return res.json({ success: true, redemptions });
  } catch (error) {
    console.error("ADMIN COUPON REDEMPTIONS ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load coupon redemptions." });
  }
};

exports.active = async (req, res) => {
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
      order: [["createdAt", "DESC"]],
    });
    return res.json({ success: true, coupons });
  } catch (error) {
    console.error("ACTIVE COUPONS ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load active coupons." });
  }
};

exports.active = async (req, res) => {
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
      order: [["createdAt", "DESC"]],
    });
    return res.json({ success: true, coupons });
  } catch (error) {
    console.error("ACTIVE COUPONS ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load active coupons." });
  }
};

/* =========================================================
   ADMIN
   GET ALL
========================================================= */

exports.getAll = async (req, res) => {
  try {
    const coupons =
      await Coupon.findAll({
        order: [
          ["createdAt", "DESC"],
        ],
      });

    return res.json({
      success: true,
      coupons,
    });
  } catch (error) {
    console.error(
      "GET COUPONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load coupons.",
    });
  }
};

/* =========================================================
   ADMIN
   GET REDEMPTIONS
========================================================= */
exports.adminRedemptions = async (req, res) => {
  try {
    const redemptions = await CouponRedemption.findAll({
      include: [
        { model: Coupon, as: "coupon", attributes: ["id", "code", "title"] },
        { model: User, as: "user", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 500,
    });

    return res.json({ success: true, redemptions });
  } catch (error) {
    console.error("ADMIN COUPON REDEMPTIONS ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load coupon redemptions." });
  }
};

/* =========================================================
   ADMIN
   GET ONE
========================================================= */

exports.getOne = async (req, res) => {
  try {
    const coupon =
      await Coupon.findByPk(
        req.params.id
      );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    return res.json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error(
      "GET COUPON ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load coupon.",
    });
  }
};

/* =========================================================
   ADMIN
   CREATE
========================================================= */

exports.create = async (req, res) => {
  try {
    const {
      code,
      title,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount,
      usage_limit,
      per_user_limit,
      starts_at,
      expires_at,
      is_active,
      festival_name,
      applies_to_all,
      product_ids,
    } = req.body;

    /* CODE */

    const normalizedCode =
      normalizeCode(code);

    if (!normalizedCode) {
      return res.status(400).json({
        success: false,
        message:
          "Coupon code is required.",
      });
    }

    /* DUPLICATE */

    const existing =
      await Coupon.findOne({
        where: {
          code: normalizedCode,
        },
      });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "Coupon code already exists.",
      });
    }

    /* DISCOUNT TYPE */

    if (
      !["percentage", "fixed"].includes(
        discount_type
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Discount type must be percentage or fixed.",
      });
    }

    /* DISCOUNT VALUE */

    const discountValue =
      Number(discount_value);

    if (
      !Number.isFinite(
        discountValue
      ) ||
      discountValue <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Discount value must be greater than 0.",
      });
    }

    if (
      discount_type === "percentage" &&
      discountValue > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Percentage discount cannot exceed 100.",
      });
    }

    /* MINIMUM */

    const minAmount =
      Number(min_order_amount || 0);

    if (
      !Number.isFinite(minAmount) ||
      minAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid minimum order amount.",
      });
    }

    /* MAX DISCOUNT */

    let maxDiscount = null;

    if (
      max_discount !== "" &&
      max_discount !== null &&
      max_discount !== undefined
    ) {
      maxDiscount =
        Number(max_discount);

      if (
        !Number.isFinite(
          maxDiscount
        ) ||
        maxDiscount < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid maximum discount.",
        });
      }
    }

    /* USAGE */

    let usageLimit = null;

    if (
      usage_limit !== "" &&
      usage_limit !== null &&
      usage_limit !== undefined
    ) {
      usageLimit =
        Number(usage_limit);

      if (
        !Number.isInteger(
          usageLimit
        ) ||
        usageLimit <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Usage limit must be a positive number.",
        });
      }
    }

    const perUserLimit =
      Number(per_user_limit || 1);

    if (
      !Number.isInteger(
        perUserLimit
      ) ||
      perUserLimit <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Per-user limit must be a positive number.",
      });
    }

    /* PRODUCT IDS */

    const productIds = Array.isArray(
      product_ids
    )
      ? [
          ...new Set(
            product_ids
              .map(Number)
              .filter(Boolean)
          ),
        ]
      : [];

    const appliesToAll =
      applies_to_all !== false &&
      applies_to_all !== "false";

    if (
      !appliesToAll &&
      productIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Select at least one product.",
      });
    }

    /* VERIFY PRODUCTS */

    if (productIds.length > 0) {
      const products =
        await Product.findAll({
          where: {
            id: productIds,
          },

          attributes: ["id"],
        });

      if (
        products.length !==
        productIds.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "One or more selected products do not exist.",
        });
      }
    }

    /* CREATE COUPON */

    const coupon =
      await Coupon.create({
        code: normalizedCode,

        title:
          title || null,

        description:
          description || null,

        discount_type,

        discount_value:
          discountValue,

        min_order_amount:
          minAmount,

        max_discount:
          maxDiscount,

        usage_limit:
          usageLimit,

        per_user_limit:
          perUserLimit,

        starts_at:
          starts_at || null,

        expires_at:
          expires_at || null,

        is_active:
          is_active !== false &&
          is_active !== "false",

        festival_name:
          festival_name || null,

        applies_to_all:
          appliesToAll,
      });

    /* SAVE PRODUCT RELATIONS */

    if (
      productIds.length > 0 &&
      CouponProduct
    ) {
      await CouponProduct.bulkCreate(
        productIds.map(
          (product_id) => ({
            coupon_id:
              coupon.id,

            product_id,
          })
        )
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Coupon created successfully.",
      coupon,
    });
  } catch (error) {
    console.error(
      "CREATE COUPON ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create coupon.",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

/* =========================================================
   ADMIN
   UPDATE
========================================================= */

exports.update = async (req, res) => {
  try {
    const coupon =
      await Coupon.findByPk(
        req.params.id
      );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message:
          "Coupon not found.",
      });
    }

    const body = req.body;

    /* CODE */

    if (
      body.code !== undefined
    ) {
      const newCode =
        normalizeCode(
          body.code
        );

      if (!newCode) {
        return res.status(400).json({
          success: false,
          message:
            "Coupon code is required.",
        });
      }

      const duplicate =
        await Coupon.findOne({
          where: {
            code: newCode,

            id: {
              [Op.ne]:
                coupon.id,
            },
          },
        });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            "Coupon code already exists.",
        });
      }

      coupon.code = newCode;
    }

    /* SIMPLE FIELDS */

    if (
      body.title !== undefined
    ) {
      coupon.title =
        body.title || null;
    }

    if (
      body.description !== undefined
    ) {
      coupon.description =
        body.description || null;
    }

    if (
      body.discount_type !==
      undefined
    ) {
      if (
        !["percentage", "fixed"].includes(
          body.discount_type
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid discount type.",
        });
      }

      coupon.discount_type =
        body.discount_type;
    }

    if (
      body.discount_value !==
      undefined
    ) {
      const value =
        Number(
          body.discount_value
        );

      if (
        !Number.isFinite(value) ||
        value <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid discount value.",
        });
      }

      if (
        coupon.discount_type ===
          "percentage" &&
        value > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Percentage discount cannot exceed 100.",
        });
      }

      coupon.discount_value =
        value;
    }

    if (
      body.min_order_amount !==
      undefined
    ) {
      coupon.min_order_amount =
        Number(
          body.min_order_amount || 0
        );
    }

    if (
      body.max_discount !==
      undefined
    ) {
      coupon.max_discount =
        body.max_discount === "" ||
        body.max_discount === null
          ? null
          : Number(
              body.max_discount
            );
    }

    if (
      body.usage_limit !==
      undefined
    ) {
      coupon.usage_limit =
        body.usage_limit === "" ||
        body.usage_limit === null
          ? null
          : Number(
              body.usage_limit
            );
    }

    if (
      body.per_user_limit !==
      undefined
    ) {
      coupon.per_user_limit =
        Number(
          body.per_user_limit || 1
        );
    }

    if (
      body.starts_at !==
      undefined
    ) {
      coupon.starts_at =
        body.starts_at || null;
    }

    if (
      body.expires_at !==
      undefined
    ) {
      coupon.expires_at =
        body.expires_at || null;
    }

    if (
      body.is_active !==
      undefined
    ) {
      coupon.is_active =
        body.is_active !== false &&
        body.is_active !== "false";
    }

    if (
      body.festival_name !==
      undefined
    ) {
      coupon.festival_name =
        body.festival_name ||
        null;
    }

    if (
      body.applies_to_all !==
      undefined
    ) {
      coupon.applies_to_all =
        body.applies_to_all !==
          false &&
        body.applies_to_all !==
          "false";
    }

    /* SAVE */

    await coupon.save();

    /* PRODUCT RELATIONS */

    if (
      Array.isArray(
        body.product_ids
      ) &&
      CouponProduct
    ) {
      const productIds = [
        ...new Set(
          body.product_ids
            .map(Number)
            .filter(Boolean)
        ),
      ];

      if (
        !coupon.applies_to_all &&
        productIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Select at least one product.",
        });
      }

      await CouponProduct.destroy({
        where: {
          coupon_id:
            coupon.id,
        },
      });

      if (productIds.length > 0) {
        await CouponProduct.bulkCreate(
          productIds.map(
            (product_id) => ({
              coupon_id:
                coupon.id,

              product_id,
            })
          )
        );
      }
    }

    return res.json({
      success: true,
      message:
        "Coupon updated successfully.",
      coupon,
    });
  } catch (error) {
    console.error(
      "UPDATE COUPON ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update coupon.",
    });
  }
};

/* =========================================================
   ADMIN
   DELETE
========================================================= */

exports.remove = async (req, res) => {
  try {
    const coupon =
      await Coupon.findByPk(
        req.params.id
      );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message:
          "Coupon not found.",
      });
    }

    if (CouponProduct) {
      await CouponProduct.destroy({
        where: {
          coupon_id:
            coupon.id,
        },
      });
    }

    await coupon.destroy();

    return res.json({
      success: true,
      message:
        "Coupon deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE COUPON ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete coupon.",
    });
  }
};