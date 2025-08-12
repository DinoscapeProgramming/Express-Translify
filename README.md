# 🚀 Express Translify 🚀

A drop-in translation module for real-world Express applications 🌍

* 🪄 **Drop-in** *(no refactoring needed)*
* 🪶 **Lightweight** *(< 19 KB)*
* ⚡ **Fast** *(smart client-side caching)*

---

## 1. 📦 Installation

```sh
$ npm install express-translify
```

## 2. 🌐 Specify Your Languages & Terms to Translate

* 📝 Head into your `package.json`
* ➕ Add your Translify options:

```js
{
  // ...

  "translify": {
    "default": "en", // default value is "en"
    "languages": [
      "de",     // 🇩🇪
      "es",     // 🇪🇸
      "zh",     // 🇨🇳
      // ...
    ],
    "terms": [
      "Welcome!",
      "Lorem ipsum...",
      // ...
    ]
  }
}
```

✨ Or, if you prefer, you can simply provide a path to an external config file like `"translify.json"` to keep things neat and separate:

```json
{
  "translify": "translify.json"
}
```

This way, you get all the flexibility without cluttering your `package.json`! 🎉

### ✍️ Placeholders in Terms

Use `[...]` to mark dynamic parts in your terms:

```json
"terms": [
  "Hello, [...]!",
  "You have [...] new messages"
]
```

> `[...]` means "leave this part out" - it won't be translated.

## 3. 🛠️ Generate Your Locales

```sh
$ npx translate
```

Need a custom output path? Use the `--out` option 🛣️:

```sh
$ npx translate --out custom-path
```

## 4. 🧩 Use Our Express Middleware

```js
const translify = require("express-translify");

app.use(translify());
```

Using a custom locales path? Pass it in with the `path` option 🗂️:

```js
app.use(translify({ path: "custom-path" }));
```

## 5. 📥 Import Translify Into Your Website

```html
<!-- Our middleware automatically serves all necessary assets -->
<script src="/translify.js"></script>
```

> **Note:** If a term matches the page title, `document.title` is translated too.

## 6. 🧭 Switching Languages at Runtime

```js
translify("de"); // 🇩🇪 Switches to German
```

## 7. 🎉 Enjoy Translations in Your App

That's it! Your Express app now speaks multiple languages - no refactoring, no stress. 🌍✨