const mix = require("laravel-mix");
const fs = require("fs");
const wpPot = require("wp-pot");

mix.options({
  autoprefixer: {
    remove: false,
  },
  processCssUrls: false,
  terser: {
    terserOptions: {
      keep_fnames: true,
    },
  },
});

mix.webpackConfig({
  target: "web",
  externals: {
    jquery: "window.jQuery",
    $: "window.jQuery",
    wp: "window.wp",
    _jltwp_spotlight: "window.jltwp_spotlight",
  },
});

// Disable notification on dev mode
if (process.env.NODE_ENV.trim() !== "production") mix.disableNotifications();

mix.sourceMaps(false, "source-map");
if (!mix.inProduction()) {
  mix.webpackConfig({
    devtool: "inline-source-map",
  });
}

if (process.env.NODE_ENV.trim() === "production") {
  // Language pot file generator
  wpPot({
    destFile: "languages/wp-spotlight.pot",
    domain: "wp-spotlight",
    package: "Spotlight",
    src: "**/*.php",
  });
}

// SCSS to CSS
mix.sass("dev/scss/sdk.scss", "assets/css/wp-spotlight.css").minify("assets/css/wp-spotlight.css");
mix
  .sass("dev/js/index.scss", "assets/css/wp-spotlight-form.css")
  .minify("assets/css/wp-spotlight-form.css");

// Script
mix.js("dev/js/index.js", "assets/js/wp-spotlight.js").react().minify("assets/js/wp-spotlight.js");
// Dark Mode Script
mix
  .js("dev/libs/dark-light-mode/darken.js", "Pro/assets/js/wp-spotlight-dark-light.js")
  .react()
  .minify("Pro/assets/js/wp-spotlight-dark-light.js");
