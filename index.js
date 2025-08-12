const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");

function translify({ path: localesPath = "locales" } = {}) {
  const router = express.Router();

  router.get("/translify.js", (req, res) => {
    res.sendFile(path.join(__dirname, "lib/translify.js"));
  });

  router.get("/translify.json", (req, res) => {
    const config = JSON.parse(fs.readFileSync("./package.json", "utf8") || "{}").translify || {};
    const { default: defaultLanguage = "en", languages = [], terms = [] } = (typeof config === "string") ? JSON.parse(fs.readFileSync(path.join(process.cwd(), config), "utf8") || "{}") : config;

    res.json({
      default: defaultLanguage,
      languages,
      terms,
      hashes: Object.fromEntries(languages.map((language) => [language, crypto.createHash("sha256").update(JSON.stringify(Object.entries(JSON.parse(fs.readFileSync(path.join(process.cwd(), localesPath, `${language}.json`)) || "{}")).sort(([firstKey, secondKey]) => firstKey.localeCompare(secondKey)))).digest("hex") || crypto.randomBytes(8).toString("hex")]))
    });
  });

  router.use("/locales", express.static(path.resolve(localesPath)));

  return router;
};

module.exports = translify;