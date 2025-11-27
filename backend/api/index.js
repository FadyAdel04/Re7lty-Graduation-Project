const path = require("path");

function loadApp() {
  const distPath = path.join(__dirname, "..", "dist", "app.js");
  const exported = require(distPath);
  return exported.default || exported.app || exported;
}

const app = loadApp();

module.exports = app;


