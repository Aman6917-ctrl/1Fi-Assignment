const express = require("express");
const {
  getAllProducts,
  getProductBySlug,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:slug", getProductBySlug);

module.exports = router;
