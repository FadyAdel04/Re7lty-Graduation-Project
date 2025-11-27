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

const connectToDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI is not set. Database features will be unavailable.");
    return;
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB || undefined,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✓ MongoDB connected (serverless function)");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    throw error;
  }
};

let dbPromise = null;

app.use(async (_req, res, next) => {
  try {
    if (!dbPromise) {
      dbPromise = connectToDatabase();
    }
    await dbPromise;
    return next();
  } catch (error) {
    return res.status(500).json({
      error: "Database connection failed",
      message: error.message || "Unable to connect to MongoDB",
    });
  }
});

// Example test route
app.get("/api/test", (_req, res) => {
  res.json({ message: "API working!", dbConnected: mongoose.connection.readyState === 1 });
});

module.exports = app;
