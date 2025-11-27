// Vercel serverless function entry point
// This file imports the Express app from the compiled TypeScript source
const app = require("../dist/app").default;

// Export as Vercel serverless handler
module.exports = app;
