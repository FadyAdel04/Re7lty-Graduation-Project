// Vercel serverless function entry point
// Use tsx to run TypeScript directly (no build step needed)
require("tsx/cjs/api/register");

// Import the app directly from TypeScript source
const app = require("../src/app").default;

// Export as Vercel serverless handler
module.exports = app;
