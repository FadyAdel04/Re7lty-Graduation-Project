// Vercel serverless function entry point
// This file imports the Express app from the compiled TypeScript source
const path = require("path");
const fs = require("fs");

// Determine the correct path based on Vercel's file structure
// In Vercel, __dirname is /var/task/backend/api when deployed from root
// or /var/task/api when deployed from backend folder
let app;
let appPath;

// Try paths in order of likelihood
const possiblePaths = [
  path.join(__dirname, "..", "dist", "app.js"),  // Relative from api/index.js (most likely)
  path.join(process.cwd(), "dist", "app.js"),  // If cwd is backend
  path.join(process.cwd(), "backend", "dist", "app.js"),  // If cwd is project root
];

// Debug: Log file system structure
console.log("=== Debugging App Load ===");
console.log("__dirname:", __dirname);
console.log("process.cwd():", process.cwd());
console.log("Files in __dirname:", fs.existsSync(__dirname) ? fs.readdirSync(__dirname) : "does not exist");
console.log("Files in parent:", fs.existsSync(path.join(__dirname, "..")) ? fs.readdirSync(path.join(__dirname, "..")) : "does not exist");

// Try each path
for (const testPath of possiblePaths) {
  console.log(`Trying path: ${testPath}`);
  if (fs.existsSync(testPath)) {
    console.log(`✓ Path exists: ${testPath}`);
    try {
      app = require(testPath).default;
      appPath = testPath;
      console.log(`✓ Successfully loaded app from: ${appPath}`);
      break;
    } catch (err) {
      console.error(`✗ Failed to require ${testPath}:`, err.message);
      continue;
    }
  } else {
    console.log(`✗ Path does not exist: ${testPath}`);
  }
}

if (!app) {
  console.error("=== All paths failed ===");
  console.error("Tried paths:", possiblePaths);
  
  // Create a minimal error handler with detailed debugging info
  const express = require("express");
  const errorApp = express();
  errorApp.use((req, res) => {
    // Try to list what files actually exist
    let dirContents = [];
    try {
      if (fs.existsSync(path.join(__dirname, ".."))) {
        dirContents = fs.readdirSync(path.join(__dirname, ".."));
      }
    } catch (e) {
      dirContents = ["Error reading directory"];
    }
    
    res.status(500).json({
      error: "Build Error",
      message: "The application was not built correctly. The dist folder is missing or the build did not complete.",
      triedPaths: possiblePaths,
      cwd: process.cwd(),
      dirname: __dirname,
      parentDirContents: dirContents,
      instructions: "Please ensure 'npm run build' completes successfully and creates the dist/app.js file"
    });
  });
  module.exports = errorApp;
} else {
  module.exports = app;
}
