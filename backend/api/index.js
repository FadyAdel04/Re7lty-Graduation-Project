const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connect DB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

// Test Route
app.get("/api", (req, res) => {
  res.json({ message: "Backend working on Vercel" });
});

// المهم جداً 👇
// لازم نعمل export للـ app، مش listen()
module.exports = app;
