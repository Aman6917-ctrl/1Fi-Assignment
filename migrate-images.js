require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/Product");

const MONGODB_URI = process.env.MONGODB_URI;
const IMAGE_BASE_URL = (process.env.IMAGE_BASE_URL || "").replace(/\/$/, "");

if (!MONGODB_URI) {
  console.error(
    "Missing MONGODB_URI. Copy .env.example to .env and set your connection string."
  );
  process.exit(1);
}

if (!IMAGE_BASE_URL) {
  console.error(
    "Missing IMAGE_BASE_URL. Example: http://localhost:5001 or https://onefi-assignment-nzq0.onrender.com"
  );
  process.exit(1);
}

function rewriteLocalhostUrl(url) {
  if (typeof url !== "string" || !url) return { url, changed: false };
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      return { url, changed: false };
    }
    return { url: `${IMAGE_BASE_URL}${parsed.pathname}`, changed: true };
  } catch {
    return { url, changed: false };
  }
}

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");
  console.log(`Replacing localhost image hosts with ${IMAGE_BASE_URL}`);

  const products = await Product.find();
  let documentsUpdated = 0;
  let variantsUpdated = 0;
  let urlsUpdated = 0;

  for (const product of products) {
    let productChanged = false;

    for (const variant of product.variants) {
      if (!Array.isArray(variant.images) || variant.images.length === 0) continue;

      let variantChanged = false;
      variant.images = variant.images.map((src) => {
        const next = rewriteLocalhostUrl(src);
        if (next.changed) {
          urlsUpdated += 1;
          variantChanged = true;
        }
        return next.url;
      });

      if (variantChanged) {
        variantsUpdated += 1;
        productChanged = true;
      }
    }

    if (productChanged) {
      await product.save();
      documentsUpdated += 1;
      console.log(`Updated ${product.slug}`);
    }
  }

  console.log(
    `Migration complete. Documents: ${documentsUpdated}, variants: ${variantsUpdated}, image URLs: ${urlsUpdated}.`
  );
  console.log("EMIPlan documents were not modified.");

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
