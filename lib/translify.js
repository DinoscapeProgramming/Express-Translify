(() => {
  let languages = [];
  let terms = [];

  const cache = new Map(Object.entries(JSON.parse(localStorage.getItem("locales") || "{}")));

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return res.json();
  };

  async function loadConfig() {
    const config = await fetchJSON("/translify.json");

    languages = config.languages || [];
    terms = config.terms || [];

    return config;
  };

  async function loadLanguage(lang) {
    if (cache.has(lang)) return cache.get(lang);

    const dataPromise = fetchJSON(`locales/${lang}.json`).catch(() => ({}));

    cache.set(lang, dataPromise);

    setTimeout(async () => {
      localStorage.setItem("locales", JSON.stringify(Object.fromEntries(await Promise.all(Array.from(cache).map(async (locale) => [locale[0], await locale[1]])))));
    }, 0);

    return dataPromise;
  };

  function extractIndent(string) {
    const lines = string.split("\n").filter((line) => line.trim() !== "");

    if (!lines.length) return ["", ""];

    const line = lines[0];

    const leadingMatch = line.match(/^(\s*)/);
    const trailingMatch = line.match(/(\s*)$/);

    const leading = (leadingMatch) ? leadingMatch[1] : "";
    const trailing = (trailingMatch) ? trailingMatch[1] : "";

    return [leading, trailing];
  };

  function applyIndent(string, [leading, trailing]) {
    return string.split("\n").map((line) => (line.trim() === "") ? line : (leading + line + trailing)).join("\n");
  };

  const translations = new Proxy({}, {
    get(target, lang) {
      if (typeof lang !== "string") return undefined;

      if (!cache.has(lang)) {
        cache.set(lang, loadLanguage(lang));

        setTimeout(async () => {
          localStorage.setItem("locales", JSON.stringify(Object.fromEntries(await Promise.all(Array.from(cache).map(async (locale) => [locale[0], await locale[1]])))));
        }, 0);
      };

      return cache.get(lang);
    }
  });

  loadConfig().then(async ({ default: defaultLanguage }) => {
    if ((navigator.language || "en").split("-")[0] === defaultLanguage) return;

    await loadLanguage((navigator.language || "en").split("-")[0]);

    const regularExpressions = terms.filter((term)  => term.includes("[...]")).map((term) => [term, new RegExp("^" + term.split(/\[\.\.\.\]/).map((part) => part.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")).join("(.+)") + "$")]);

    async function translateTextNode(textNode, reverse) {
      const originalText = textNode.textContent.trim();

      if (!originalText) return;

      const dictionary = (!reverse) ? ((await translations?.[(navigator.language || "en").split("-")[0]]) || {}) : Object.fromEntries(Object.entries((await translations?.[reverse]) || {}).map(([key, value]) => [
        value, key
      ]));

      const [rawExpression, regularExpression] = (!Object.hasOwn(dictionary, originalText)) ? (regularExpressions.find((pair) => pair[0].replaceAll("[...]", " ").split(" ").every((part) => originalText.includes(part)) && pair[1].test(originalText)) || []) : [];

      if (!Object.hasOwn(dictionary, originalText) && !rawExpression) return;

      textNode.textContent = applyIndent((regularExpression) ? dictionary[rawExpression].replace(/\[\.\.\.\]/g, () => originalText.match(regularExpression)[index++]) : dictionary[originalText], extractIndent(textNode.textContent));
    };

    async function translateElementNode(elementNode, reverse) {
      const dictionary = (!reverse) ? ((await translations?.[(navigator.language || "en").split("-")[0]]) || {}) : Object.fromEntries(Object.entries((await translations?.[reverse]) || {}).map(([key, value]) => [
        value, key
      ]));

      if (elementNode === "title") {
        const originalText = document.title.trim();

        const [rawExpression, regularExpression] = (!Object.hasOwn(dictionary, originalText)) ? (regularExpressions.find((pair) => pair[0].replaceAll("[...]", " ").split(" ").every((part) => originalText.includes(part)) && pair[1].test(originalText)) || []) : [];

        if (!originalText || (!Object.hasOwn(dictionary, originalText) && !rawExpression)) return;

        document.title = applyIndent((regularExpression) ? dictionary[rawExpression].replace(/\[\.\.\.\]/g, () => originalText.match(regularExpression)[index++]) : dictionary[originalText], extractIndent(document.title));
      };

      [
        "title",
        "placeholder"
      ].forEach((attribute) => {
        const originalText = elementNode.getAttribute(attribute)?.trim();

        const [rawExpression, regularExpression] = (!Object.hasOwn(dictionary, originalText)) ? (regularExpressions.find((pair) => pair[0].replaceAll("[...]", " ").split(" ").every((part) => originalText.includes(part)) && pair[1].test(originalText)) || []) : [];

        if (!originalText || (!Object.hasOwn(dictionary, originalText) && !rawExpression)) return;

        elementNode.setAttribute(attribute, applyIndent((regularExpression) ? dictionary[rawExpression].replace(/\[\.\.\.\]/g, () => originalText.match(regularExpression)[index++]) : dictionary[originalText], extractIndent(elementNode.getAttribute(attribute))));
      });
    };

    function scanAndTranslate(node, reverse = false) {
      if (!reverse && (((navigator.language || "en").split("-")[0]) === "en")) return;

      translateElementNode("title");

      if (node.nodeType === Node.TEXT_NODE) {
        translateTextNode(node, reverse);
      } else {
        if ((node.nodeType === Node.ELEMENT_NODE) && ["LABEL", "BUTTON", "INPUT", "TEXTAREA"].includes(node.tagName) && (node.title?.trim() || node.placeholder?.trim())) translateElementNode(node, reverse || (navigator.language || "en").split("-")[0]);

        node.childNodes.forEach((node) => scanAndTranslate(node, reverse));
      };
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => scanAndTranslate(node));
      };
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    document.addEventListener("DOMContentLoaded", () => {
      scanAndTranslate(document.body);
    });

    scanAndTranslate(document.body);

    window.translify = async (language) => {
      if ((navigator.language || defaultLanguage).split("-")[0] !== defaultLanguage) await scanAndTranslate(document.body, storedSettings.language || (navigator.language || "en").split("-")[0]);
      if (language !== defaultLanguage) await scanAndTranslate(document.body);

      return true;
    };
  }).catch(console.error);
})();