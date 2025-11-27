const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: [
    "https://re7lty-graduation-project.vercel.app",
    "http://localhost:5000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options("*", cors());

app.use(express.json());

// Example test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API working!" });
});

module.exports = app;
