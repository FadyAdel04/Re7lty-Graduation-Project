// Vercel serverless function entry point
// This file imports the Express app from the compiled TypeScript source
const path = require("path");

// Try multiple possible paths for the compiled app
const possiblePaths = [
  path.join(__dirname, "..", "dist", "app.js"),  // Relative from api/index.js
  path.join(process.cwd(), "backend", "dist", "app.js"),  // From project root
  path.join(process.cwd(), "dist", "app.js"),  // If cwd is backend
];

let app;
let loadedPath = null;

for (const appPath of possiblePaths) {
  try {
    app = require(appPath).default;
    loadedPath = appPath;
    console.log("Successfully loaded app from:", loadedPath);
    break;
  } catch (err) {
    // Continue to next path
    continue;
  }
}

if (!app) {
  console.error("Failed to load app. Tried paths:", possiblePaths);
  console.error("Current working directory:", process.cwd());
  console.error("__dirname:", __dirname);
  
  // Create a minimal error handler
  const express = require("express");
  const errorApp = express();
  errorApp.use((req, res) => {
    res.status(500).json({
      error: "Build Error",
      message: "The application was not built correctly. Please ensure the build completes successfully.",
      triedPaths: possiblePaths,
      cwd: process.cwd(),
      dirname: __dirname
    });
  });
  module.exports = errorApp;
} else {
  module.exports = app;
}
