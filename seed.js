require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/Product");
const EMIPlan = require("./models/EMIPlan");

const MONGODB_URI = process.env.MONGODB_URI;
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

const products = [
  {
    slug: "iphone-17-pro",
    name: "iPhone 17 Pro",
    brand: "Apple",
    tier: "premium",
    variants: [
      {
        variantId: "256gb-silver",
        label: "256GB, Silver",
        mrp: 134900,
        price: 127400,
        images: [
          "https://picsum.photos/seed/iphone-17-pro-silver-1/800/800",
          "https://picsum.photos/seed/iphone-17-pro-silver-2/800/800",
        ],
      },
      {
        variantId: "256gb-orange",
        label: "256GB, Orange",
        mrp: 134900,
        price: 127400,
        images: [
          "https://picsum.photos/seed/iphone-17-pro-orange-1/800/800",
          "https://picsum.photos/seed/iphone-17-pro-orange-2/800/800",
        ],
      },
    ],
  },
  {
    slug: "samsung-galaxy-s24-ultra",
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    tier: "flagship",
    variants: [
      {
        variantId: "256gb-titanium-black",
        label: "256GB, Titanium Black",
        mrp: 134999,
        price: 121999,
        images: [
          "https://picsum.photos/seed/s24-ultra-black-1/800/800",
          "https://picsum.photos/seed/s24-ultra-black-2/800/800",
        ],
      },
      {
        variantId: "512gb-titanium-gray",
        label: "512GB, Titanium Gray",
        mrp: 144999,
        price: 129999,
        images: [
          "https://picsum.photos/seed/s24-ultra-gray-1/800/800",
          "https://picsum.photos/seed/s24-ultra-gray-2/800/800",
        ],
      },
    ],
  },
  {
    slug: "oneplus-12",
    name: "OnePlus 12",
    brand: "OnePlus",
    tier: "mid",
    variants: [
      {
        variantId: "256gb-flowy-emerald",
        label: "256GB, Flowy Emerald",
        mrp: 64999,
        price: 54999,
        images: [
          "https://picsum.photos/seed/oneplus-12-emerald-1/800/800",
          "https://picsum.photos/seed/oneplus-12-emerald-2/800/800",
        ],
      },
      {
        variantId: "512gb-silky-black",
        label: "512GB, Silky Black",
        mrp: 69999,
        price: 59999,
        images: [
          "https://picsum.photos/seed/oneplus-12-black-1/800/800",
          "https://picsum.photos/seed/oneplus-12-black-2/800/800",
        ],
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
