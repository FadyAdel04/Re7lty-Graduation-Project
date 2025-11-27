const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("../dist/app.js").default;

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const DB_URI = process.env.MONGODB_URI;

if (!DB_URI) {
  console.warn("MONGODB_URI is not set. Database features will be unavailable.");
} else {
  mongoose
    .connect(DB_URI, {
      dbName: process.env.MONGODB_DB || undefined,
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => console.log("✓ MongoDB connection successful!"))
    .catch((err) => console.error("DB connection error:", err.message));
}

module.exports = app;
