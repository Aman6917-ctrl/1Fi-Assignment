const express = require("express");
const {
  getAllProducts,
  getFeaturedDeals,
  getProductBySlug,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", getAllProducts);
router.get("/deals", getFeaturedDeals);
router.get("/:slug", getProductBySlug);

module.exports = router;
