(() => {
  let hashes;
  let terms = [];
  let currentLanguage;

  const cache = new Map(Object.entries(JSON.parse(localStorage.getItem("locales") || "{}")));

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return res.json();
  };

  async function loadConfig() {
    const config = await fetchJSON("/translify.json");

    terms = config.terms || [];
    hashes = config.hashes;

    return config;
  };

  async function loadLanguage(language) {
    if (cache.has(language) && (cache.get(language)[0] === hashes[language])) return cache.get(language)[1];

    const dataPromise = fetchJSON(`locales/${language}.json`).catch(() => ({}));

    cache.set(language, [hashes[language], dataPromise]);

    setTimeout(async () => {
      localStorage.setItem("locales", JSON.stringify(Object.fromEntries(await Promise.all(Array.from(cache).map(async (locale) => [locale[0], [hashes[language], await locale[1][1]]])))));
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
    get(target, language) {
      if (typeof language !== "string") return undefined;

      if (!cache.has(language) || (cache.get(language)[0] !== hashes[language])) {
        cache.set(language, [hashes[language], loadLanguage(language)]);

        setTimeout(async () => {
          localStorage.setItem("locales", JSON.stringify(Object.fromEntries(await Promise.all(Array.from(cache).map(async (locale) => [locale[0], [hashes[language], await locale[1][1]]])))));
        }, 0);
      };

      return cache.get(language)[1];
    }
  });

  loadConfig().then(async ({ default: defaultLanguage }) => {
    if ((navigator.language || "en").split("-")[0] === defaultLanguage) return;

    await loadLanguage((navigator.language || "en").split("-")[0]);

    const regularExpressions = terms.filter((term)  => term.includes("[...]")).map((term) => [term, new RegExp("^" + term.split(/\[\.\.\.\]/).map((part) => part.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")).join("(.+)") + "$")]);

    async function translateTextNode(textNode, { language, reverse = false } = {}) {
      const originalText = textNode.textContent.trim();

      if (!originalText) return;

      const dictionary = (!reverse) ? ((await translations?.[(language || navigator.language || "en").split("-")[0]]) || {}) : Object.fromEntries(Object.entries((await translations?.[reverse]) || {}).map(([key, value]) => [
        value, key
      ]));

      const [rawExpression, regularExpression] = (!Object.hasOwn(dictionary, originalText)) ? (regularExpressions.find((pair) => pair[0].replaceAll("[...]", " ").split(" ").every((part) => originalText.includes(part)) && pair[1].test(originalText)) || []) : [];

      if (!Object.hasOwn(dictionary, originalText) && !rawExpression) return;

      let index = 1;

      textNode.textContent = applyIndent((regularExpression) ? dictionary[rawExpression].replace(/\[\.\.\.\]/g, () => originalText.match(regularExpression)[index++]) : dictionary[originalText], extractIndent(textNode.textContent));
    };

    async function translateElementNode(elementNode, { language, reverse = false } = {}) {
      const dictionary = (!reverse) ? ((await translations?.[(language || navigator.language || "en").split("-")[0]]) || {}) : Object.fromEntries(Object.entries((await translations?.[reverse]) || {}).map(([key, value]) => [
        value, key
      ]));

      if (elementNode === "title") {
        const originalText = document.title.trim();

        const [rawExpression, regularExpression] = (!Object.hasOwn(dictionary, originalText)) ? (regularExpressions.find((pair) => pair[0].replaceAll("[...]", " ").split(" ").every((part) => originalText.includes(part)) && pair[1].test(originalText)) || []) : [];

        if (!originalText || (!Object.hasOwn(dictionary, originalText) && !rawExpression)) return;

        let index = 1;

        document.title = applyIndent((regularExpression) ? dictionary[rawExpression].replace(/\[\.\.\.\]/g, () => originalText.match(regularExpression)[index++]) : dictionary[originalText], extractIndent(document.title));
      } else {
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
    };

    function scanAndTranslate(node, { language, reverse = false } = {}) {
      if (!reverse && (((language || navigator.language || "en").split("-")[0]) === "en")) return;

      translateElementNode("title");

      if (node.nodeType === Node.TEXT_NODE) {
        translateTextNode(node, { language, reverse });
      } else {
        if ((node.nodeType === Node.ELEMENT_NODE) && ["LABEL", "BUTTON", "INPUT", "TEXTAREA"].includes(node.tagName) && (node.title?.trim() || node.placeholder?.trim())) translateElementNode(node, { language, reverse });

        node.childNodes.forEach((node) => scanAndTranslate(node, { language, reverse }));
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
      if ((navigator.language || defaultLanguage).split("-")[0] !== defaultLanguage) await scanAndTranslate(document.body, { reverse: (currentLanguage || navigator.language || "en").split("-")[0] });
      if (language !== defaultLanguage) await scanAndTranslate(document.body, { language });

      currentLanguage = language;

      return true;
    };
  }).catch(console.error);
})();