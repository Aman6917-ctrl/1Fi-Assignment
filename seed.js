require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/Product");
const EMIPlan = require("./models/EMIPlan");

const MONGODB_URI = process.env.MONGODB_URI;
const IMAGE_BASE_URL = (
  process.env.IMAGE_BASE_URL || `http://localhost:${process.env.PORT || 5001}`
).replace(/\/$/, "");
const TENURES = [3, 6, 12, 24, 36];

if (!MONGODB_URI) {
  console.error(
    "Missing MONGODB_URI. Copy .env.example to .env and set your connection string."
  );
  process.exit(1);
}

/**
 * 0% EMI: split the selling price evenly across the tenure.
 * 10.5% EMI (36+ months): standard reducing-balance EMI formula.
 */
function calculateMonthlyAmount(price, tenureMonths, interestRate) {
  if (interestRate === 0) {
    return Math.round(price / tenureMonths);
  }

  const monthlyRate = interestRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (price * monthlyRate * factor) / (factor - 1);
  return Math.round(emi);
}

function interestForTenure(tenureMonths) {
  return tenureMonths >= 36 ? 10.5 : 0;
}

function cashbackFor(tier, tenureMonths) {
  const byTenure = {
    3: 0,
    6: 1,
    12: 2,
    24: 3,
    36: 4,
  };
  const ladders = {
    premium: [1000, 2000, 3500, 5000, 7500],
    flagship: [1000, 1500, 2500, 4000, 5000],
    mid: [1000, 1000, 1500, 2000, 3000],
  };
  return ladders[tier][byTenure[tenureMonths]];
}

function image(filename) {
  return `${IMAGE_BASE_URL}/images/${filename}`;
}

const products = [
  {
    slug: "iphone-17-pro",
    name: "iPhone 17 Pro",
    brand: "Apple",
    tier: "premium",
    placement: "deals",
    dealTag: "Best Seller",
    variants: [
      {
        variantId: "256gb-silver",
        label: "256GB, Silver",
        mrp: 134900,
        price: 127400,
        images: [image("iphone-17-pro-silver.jpg")],
      },
      {
        variantId: "256gb-orange",
        label: "256GB, Orange",
        mrp: 134900,
        price: 127400,
        images: [image("iphone-17-pro-orange.jpg")],
      },
    ],
  },
  {
    slug: "samsung-galaxy-s24-ultra",
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    tier: "flagship",
    placement: "deals",
    dealTag: "Limited Time",
    variants: [
      {
        variantId: "256gb-titanium-black",
        label: "256GB, Titanium Black",
        mrp: 134999,
        price: 121999,
        images: [image("samsung-galaxy-s24-ultra-black.jpg")],
      },
      {
        variantId: "512gb-titanium-gray",
        label: "512GB, Titanium Gray",
        mrp: 144999,
        price: 129999,
        images: [image("samsung-galaxy-s24-ultra-gray.jpg")],
      },
    ],
  },
  {
    slug: "oneplus-12",
    name: "OnePlus 12",
    brand: "OnePlus",
    tier: "mid",
    placement: "deals",
    dealTag: "Hot Deal",
    variants: [
      {
        variantId: "256gb-flowy-emerald",
        label: "256GB, Flowy Emerald",
        mrp: 64999,
        price: 54999,
        images: [image("oneplus-12-emerald.jpg")],
      },
      {
        variantId: "512gb-silky-black",
        label: "512GB, Silky Black",
        mrp: 69999,
        price: 59999,
        images: [image("oneplus-12-black.jpg")],
      },
    ],
  },
  {
    slug: "pixel-9-pro",
    name: "Pixel 9 Pro",
    brand: "Google",
    tier: "premium",
    placement: "deals",
    dealTag: "Trending",
    variants: [
      {
        variantId: "128gb-porcelain",
        label: "128GB, Porcelain",
        mrp: 109999,
        price: 99999,
        images: [image("pixel-9-pro-porcelain.jpg")],
      },
      {
        variantId: "256gb-porcelain",
        label: "256GB, Porcelain",
        mrp: 119999,
        price: 109999,
        images: [image("pixel-9-pro-porcelain.jpg")],
      },
    ],
  },
  {
    slug: "nothing-phone-3",
    name: "Nothing Phone (3)",
    brand: "Nothing",
    tier: "mid",
    placement: "hero",
    dealTag: "New",
    variants: [
      {
        variantId: "128gb-black",
        label: "128GB, Black",
        mrp: 49999,
        price: 44999,
        images: [image("nothing-phone-3-black.jpg")],
      },
      {
        variantId: "256gb-black",
        label: "256GB, Black",
        mrp: 54999,
        price: 49999,
        images: [image("nothing-phone-3-black.jpg")],
      },
    ],
  },
  {
    slug: "xiaomi-14-ultra",
    name: "Xiaomi 14 Ultra",
    brand: "Xiaomi",
    tier: "flagship",
    placement: "hero",
    dealTag: "Leica",
    variants: [
      {
        variantId: "512gb-black",
        label: "512GB, Black",
        mrp: 99999,
        price: 89999,
        images: [image("xiaomi-14-ultra-black.jpg")],
      },
      {
        variantId: "512gb-white",
        label: "512GB, White",
        mrp: 99999,
        price: 89999,
        images: [image("xiaomi-14-ultra-black.jpg")],
      },
    ],
  },
  {
    slug: "motorola-razr-50",
    name: "Motorola Razr 50",
    brand: "Motorola",
    tier: "mid",
    placement: "catalogue",
    dealTag: "Flip",
    variants: [
      {
        variantId: "256gb-peach",
        label: "256GB, Peach",
        mrp: 69999,
        price: 59999,
        images: [image("motorola-razr-50-peach.jpg")],
      },
      {
        variantId: "256gb-black",
        label: "256GB, Black",
        mrp: 69999,
        price: 59999,
        images: [image("motorola-razr-50-peach.jpg")],
      },
    ],
  },
  {
    slug: "vivo-x200-pro",
    name: "Vivo X200 Pro",
    brand: "Vivo",
    tier: "flagship",
    placement: "catalogue",
    dealTag: "ZEISS",
    variants: [
      {
        variantId: "512gb-titanium",
        label: "512GB, Titanium",
        mrp: 104999,
        price: 94999,
        images: [image("vivo-x200-pro-titanium.jpg")],
      },
      {
        variantId: "256gb-titanium",
        label: "256GB, Titanium",
        mrp: 94999,
        price: 84999,
        images: [image("vivo-x200-pro-titanium.jpg")],
      },
    ],
  },
];

function buildEmiPlans() {
  const plans = [];

  for (const product of products) {
    for (const variant of product.variants) {
      for (const tenureMonths of TENURES) {
        const interestRate = interestForTenure(tenureMonths);
        plans.push({
          productSlug: product.slug,
          variantId: variant.variantId,
          tenureMonths,
          monthlyAmount: calculateMonthlyAmount(
            variant.price,
            tenureMonths,
            interestRate
          ),
          interestRate,
          cashback: cashbackFor(product.tier, tenureMonths),
        });
      }
    }
  }

  return plans;
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    await Product.deleteMany({});
    await EMIPlan.deleteMany({});
    console.log("Cleared Product and EMIPlan collections");

    const productDocs = products.map(({ tier, ...product }) => product);
    await Product.insertMany(productDocs);

    const emiPlans = buildEmiPlans();
    await EMIPlan.insertMany(emiPlans);

    console.log(
      `Seed complete: ${productDocs.length} products and ${emiPlans.length} EMI plans inserted.`
    );
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

seed();
