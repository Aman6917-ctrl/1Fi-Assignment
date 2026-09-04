const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    variantId: {
      type: String,
      required: [true, "variantId is required"],
      trim: true,
    },
    label: {
      type: String,
      required: [true, "variant label is required"],
      trim: true,
    },
    mrp: {
      type: Number,
      required: [true, "MRP is required"],
      min: [0, "MRP cannot be negative"],
    },
    price: {
      type: Number,
      required: [true, "price is required"],
      min: [0, "price cannot be negative"],
    },
    images: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, "slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "brand is required"],
      trim: true,
    },
    isFeaturedDeal: {
      type: Boolean,
      default: false,
    },
    dealTag: {
      type: String,
      trim: true,
    },
    dealPriority: {
      type: Number,
      default: 0,
    },
    variants: {
      type: [variantSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "A product must have at least one variant",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
