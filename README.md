# 🚀 Express Translify

A drop-in translation module for real-world Express applications 🌍

* ⚡ **Drop-in** *(no refactoring needed)*
* 🪶 **Lightweight** *(< 15 KB)*
* 🚀 **Fast** *(caching)*

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

## 3. 🛠️ Generate Your Locales

```sh
$ npx translate
```

Need a custom output path? Use the --out option 🛣️:

```sh
$ npx translate --out custom-path
```

## 4. 🧩 Use Our Express Middleware

```js
const translify = require("express-translify");

app.use(translify());
```

Using a custom locales path? Pass it in with the path option 🗂️:

```js
app.use(translify({ path: "custom-path" }));
```

## 5. 🌐 Import Translify Into Your Website

```html
<!-- Our middleware automatically serves all necessary assets -->
<script src="/translify.js"></script>
```

## 6. 🎉 Enjoy Translations in Your App

That's it! Your Express app now speaks multiple languages - no refactoring, no stress. 🌍✨