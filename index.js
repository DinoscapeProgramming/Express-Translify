const fs = require("fs");
const path = require("path");
const express = require("express");

function translify({ path: localesPath = "locales" } = {}) {
  const router = express.Router();

  router.get("/translify.js", (req, res) => {
    res.sendFile(path.join(__dirname, "lib/translify.js"));
  });

  router.get("/translify.json", (req, res) => {
    const { default: defaultLanguage = "en", languages = [], terms = [] } = JSON.parse(fs.readFileSync("./package.json", "utf8") || "{}").translify || {};

    res.json({
      default: defaultLanguage,
      languages,
      terms
    });
  });

  router.use(`/${localesPath}`, express.static(path.resolve(localesPath)));

  return router;
};

module.exports = translify;