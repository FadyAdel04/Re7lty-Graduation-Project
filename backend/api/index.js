const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

const app = express();

app.use(
  cors({
    origin: [
      "https://re7lty-graduation-project.vercel.app",
      "http://localhost:5000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());
app.use(express.json());

const DB_URI = process.env.MONGODB_URI;

if (!DB_URI) {
  console.warn("MONGODB_URI is not set. Database features will be unavailable.");
} else {
  mongoose
    .connect(DB_URI, {
      dbName: process.env.MONGODB_DB || undefined,
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      console.log("✓ MongoDB connection successful!");
    })
    .catch((err) => {
      console.error("DB connection error:", err.message);
    });
}

// Example test route
app.get("/api/test", (_req, res) => {
  res.json({ message: "API working!", dbConnected: mongoose.connection.readyState === 1 });
});

module.exports = app;
