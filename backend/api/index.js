// Vercel serverless function entry point
// This imports the compiled Express app
const path = require("path");
const fs = require("fs");

// Determine the correct path to dist/app.js
// When deployed from root: /var/task/backend/api/index.js -> /var/task/backend/dist/app.js
// When deployed from backend: /var/task/api/index.js -> /var/task/dist/app.js
const distPath = path.join(__dirname, "..", "dist", "app.js");

console.log("=== Loading App ===");
console.log("__dirname:", __dirname);
console.log("Looking for app at:", distPath);
console.log("Parent directory contents:", fs.existsSync(path.join(__dirname, "..")) ? fs.readdirSync(path.join(__dirname, "..")) : "does not exist");

let app;
if (fs.existsSync(distPath)) {
  try {
    app = require(distPath).default;
    console.log("✓ Successfully loaded app from:", distPath);
  } catch (err) {
    console.error("✗ Failed to require app:", err.message);
    console.error("Stack:", err.stack);
    throw err;
  }
} else {
  console.error("✗ dist/app.js does not exist at:", distPath);
  console.error("Current working directory:", process.cwd());
  
  // List what's actually in the parent directory
  const parentDir = path.join(__dirname, "..");
  if (fs.existsSync(parentDir)) {
    console.error("Files in parent directory:", fs.readdirSync(parentDir));
  }
  
  // Create error handler
  const express = require("express");
  const errorApp = express();
  errorApp.use((req, res) => {
    res.status(500).json({
      error: "Build Error",
      message: "The dist/app.js file was not found. The build may not have completed successfully.",
      expectedPath: distPath,
      dirname: __dirname,
      cwd: process.cwd(),
      instructions: "Please check the Vercel build logs to ensure 'npm run build' completed successfully."
    });
  });
  app = errorApp;
}

module.exports = app;
