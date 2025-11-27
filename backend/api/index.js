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

// Import routes
const notificationRoutes = require("./routes/notifications");
const profileRoutes = require("./routes/profiles");
const tripRoutes = require("./routes/trips");
const userRoutes = require("./routes/users");
const searchRoutes = require("./routes/search");


// Use routes
app.use("/api/notifications", notificationRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/users", userRoutes);
app.use("/api/search", searchRoutes);

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API working!" });
});

module.exports = app;
