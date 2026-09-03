const mongoose = require("mongoose");

const emiPlanSchema = new mongoose.Schema(
  {
    productSlug: {
      type: String,
      required: [true, "productSlug is required"],
      trim: true,
      lowercase: true,
      index: true,
    },
    variantId: {
      type: String,
      required: [true, "variantId is required"],
      trim: true,
      index: true,
    },
    tenureMonths: {
      type: Number,
      required: [true, "tenureMonths is required"],
      min: [1, "tenure must be at least 1 month"],
    },
    monthlyAmount: {
      type: Number,
      required: [true, "monthlyAmount is required"],
      min: [0, "monthlyAmount cannot be negative"],
    },
    interestRate: {
      type: Number,
      required: [true, "interestRate is required"],
      min: [0, "interestRate cannot be negative"],
    },
    cashback: {
      type: Number,
      default: 0,
      min: [0, "cashback cannot be negative"],
    },
  },
  { timestamps: true }
);

// One plan per tenure for a given product variant
emiPlanSchema.index(
  { productSlug: 1, variantId: 1, tenureMonths: 1 },
  { unique: true }
);

module.exports = mongoose.model("EMIPlan", emiPlanSchema);
