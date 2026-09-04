const express = require("express");
const {
  getAllProducts,
  getDeals,
  getProductBySlug,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", getAllProducts);
router.get("/deals", getDeals);
router.get("/:slug", getProductBySlug);

module.exports = router;
