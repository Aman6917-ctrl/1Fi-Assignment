const Product = require("../models/Product");
const EMIPlan = require("../models/EMIPlan");
const { publicOrigin, rewriteAssetUrl, rewriteImageList } = require("../utils/imageUrls");

/**
 * GET /api/products
 * Lightweight listing used by the product grid: slug, name, brand,
 * first-variant thumbnail, and lowest variant price.
 */
async function getAllProducts(req, res) {
  try {
    const origin = publicOrigin(req);
    const products = await Product.find().lean();

    const payload = products.map((product) => {
      const firstVariant = product.variants[0];
      const startingPrice = Math.min(
        ...product.variants.map((variant) => variant.price)
      );

      return {
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        thumbnail: rewriteAssetUrl(firstVariant?.images?.[0] || null, origin),
        startingPrice,
        startingEmi: Math.round(startingPrice / 24),
        placement: product.placement || "catalogue",
      };
    });

    return res.status(200).json(payload);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Could not fetch products. Please try again later.",
    });
  }
}

/**
 * GET /api/products/deals
 * Catalog items with MRP, discount %, and a deal tag for the homepage strip.
 */
async function getDeals(_req, res) {
  try {
    const origin = publicOrigin(_req);
    const products = await Product.find({ placement: "deals" }).lean();

    const payload = products.map((product) => {
      const firstVariant = product.variants[0];
      const startingPrice = Math.min(
        ...product.variants.map((variant) => variant.price)
      );
      const mrp = firstVariant?.mrp ?? startingPrice;
      const discountPercent =
        mrp > startingPrice ? Math.round(((mrp - startingPrice) / mrp) * 100) : 0;

      return {
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        thumbnail: rewriteAssetUrl(firstVariant?.images?.[0] || null, origin),
        startingPrice,
        mrp,
        discountPercent,
        dealTag: product.dealTag || "Deal",
      };
    });

    return res.status(200).json(payload);
  } catch (error) {
    console.error("Failed to fetch deals:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Could not fetch deals. Please try again later.",
    });
  }
}

/**
 * GET /api/products/:slug
 * Full product detail with EMI plans nested under each variant.
 */
async function getProductBySlug(req, res) {
  try {
    const origin = publicOrigin(req);
    const { slug } = req.params;

    const product = await Product.findOne({ slug }).lean();
    if (!product) {
      return res.status(404).json({
        error: "Not found",
        message: `No product found with slug "${slug}"`,
      });
    }

    const emiPlans = await EMIPlan.find({ productSlug: slug })
      .sort({ tenureMonths: 1 })
      .lean();

    const plansByVariant = emiPlans.reduce((acc, plan) => {
      if (!acc[plan.variantId]) {
        acc[plan.variantId] = [];
      }
      acc[plan.variantId].push({
        tenureMonths: plan.tenureMonths,
        monthlyAmount: plan.monthlyAmount,
        interestRate: plan.interestRate,
        cashback: plan.cashback,
      });
      return acc;
    }, {});

    const variants = product.variants.map((variant) => ({
      variantId: variant.variantId,
      label: variant.label,
      mrp: variant.mrp,
      price: variant.price,
      images: rewriteImageList(variant.images, origin),
      emiPlans: plansByVariant[variant.variantId] || [],
    }));

    return res.status(200).json({
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      variants,
    });
  } catch (error) {
    console.error("Failed to fetch product by slug:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Could not fetch product. Please try again later.",
    });
  }
}

module.exports = {
  getAllProducts,
  getDeals,
  getProductBySlug,
};
