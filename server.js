require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const productRoutes = require("./routes/products");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    "Missing MONGODB_URI. Copy .env.example to .env and set your connection string."
  );
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "public", "images")));

app.get("/", (_req, res) => {
  res.status(200).json({
    name: "Corpus EMI API",
    status: "ok",
    message:
      "This is the backend API, not the shopping website. Use the frontend for the UI.",
    endpoints: {
      health: "/health",
      products: "/api/products",
      deals: "/api/products/deals",
      product: "/api/products/:slug",
      imageExample: "/images/iphone-17-pro-silver.jpg",
    },
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/products", productRoutes);

app.use((_req, res) => {
  res.status(404).json({
    error: "Not found",
    message: "The requested resource does not exist.",
  });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: "Something went wrong.",
  });
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

mongoose.connection.on("error", (error) => {
  console.error("MongoDB runtime error:", error.message);
});

start();
