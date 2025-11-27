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

const resolveRouter = (path) => {
  const mod = require(path);
  return mod.default || mod;
};

const tripsRouter = resolveRouter("../dist/routes/trips.js");
const profilesRouter = resolveRouter("../dist/routes/profiles.js");
const usersRouter = resolveRouter("../dist/routes/users.js");
const searchRouter = resolveRouter("../dist/routes/search.js");
const notificationsRouter = resolveRouter("../dist/routes/notifications.js");

app.use("/api/trips", tripsRouter);
app.use("/api/profiles", profilesRouter);
app.use("/api/users", usersRouter);
app.use("/api/search", searchRouter);
app.use("/api/notifications", notificationsRouter);

app.use("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "backend",
    dbConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

module.exports = app;
