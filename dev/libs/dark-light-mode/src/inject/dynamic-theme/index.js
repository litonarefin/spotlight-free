import { DEFAULT_THEME } from "../../default";
import { getCSSFilterValue } from "../../generators/css-filter";
import {
  modifyBackgroundColor,
  modifyColor,
  modifyForegroundColor,
} from "../../generators/modify-colors";
import { forEach, toArray } from "../../utils/array";
import { clearColorCache, parseColorWithCache } from "../../utils/color";
import { throttle } from "../../utils/throttle";
import { parsedURLCache } from "../../utils/url";
import {
  documentIsVisible,
  removeDocumentVisibilityListener,
  setDocumentVisibilityListener,
} from "../../utils/visibility";
import {
  cleanReadyStateCompleteListeners,
  isDOMReady,
  iterateShadowHosts,
  removeDOMReadyListener,
  removeNode,
  watchForNodePosition,
} from "../utils/dom";
// import { logInfo } from "../utils/log";
import {
  INLINE_STYLE_SELECTOR,
  getInlineOverrideStyle,
  overrideInlineStyle,
  stopWatchingForInlineStyles,
} from "./inline-style";
import {
  cleanModificationCache,
  getModifiedFallbackStyle,
  getModifiedUserAgentStyle,
  getSelectionColor,
} from "./modify-css";
import { getManageableStyles, manageStyle } from "./style-manager";
import { variablesStore } from "./variables";
import { stopWatchingForStyleChanges } from "./watch";

let filter = DEFAULT_THEME;

let fixes = null;
let isIFrame = null;
const styleManagers = new Map();
let ignoredImageAnalysisSelectors = [];
let ignoredInlineSelectors = [];
const adoptedStyleManagers = [];

function createOrUpdateStyle(className, root = document.head || document) {
  let element = root.querySelector(`.${className}`);
  if (!element) {
    element = document.createElement("style");
    element.classList.add("spotlight");
    element.classList.add(className);
    element.media = "screen";
    element.textContent = "";
  }
  return element;
}

const nodePositionWatchers = new Map();

// **important**
function setupNodePositionWatcher(node, alias) {
  nodePositionWatchers.has(alias) && nodePositionWatchers.get(alias).stop();
  nodePositionWatchers.set(alias, watchForNodePosition(node, "head"));
}

function createStaticStyleOverrides() {
  const fallbackStyle = createOrUpdateStyle("spotlight--fallback", document);
  fallbackStyle.textContent = getModifiedFallbackStyle(filter, { strict: true });

  document.head.insertBefore(fallbackStyle, document.head.firstChild);
  setupNodePositionWatcher(fallbackStyle, "fallback");

  const userAgentStyle = createOrUpdateStyle("spotlight--user-agent");
  userAgentStyle.textContent = getModifiedUserAgentStyle(
    filter,
    isIFrame,
    filter.styleSystemControls
  );
  document.head.insertBefore(userAgentStyle, fallbackStyle.nextSibling);
  setupNodePositionWatcher(userAgentStyle, "user-agent");

  const textStyle = createOrUpdateStyle("spotlight--text");
  if (filter.useFont || filter.textStroke > 0) {
    textStyle.textContent = createTextStyle(filter);
  } else {
    textStyle.textContent = "";
  }
  document.head.insertBefore(textStyle, fallbackStyle.nextSibling);
  setupNodePositionWatcher(textStyle, "text");

  const invertStyle = createOrUpdateStyle("spotlight--invert");
  if (fixes && Array.isArray(fixes.invert) && fixes.invert.length > 0) {
    invertStyle.textContent = [
      `${fixes.invert.join(", ")} {`,
      `    filter: ${getCSSFilterValue({
        ...filter,
        contrast: filter.mode === 0 ? filter.contrast : clamp(filter.contrast - 10, 0, 100),
      })} !important;`,
      "}",
    ].join("\n");
  } else {
    invertStyle.textContent = "";
  }
  document.head.insertBefore(invertStyle, textStyle.nextSibling);
  setupNodePositionWatcher(invertStyle, "invert");

  const inlineStyle = createOrUpdateStyle("spotlight--inline");
  inlineStyle.textContent = getInlineOverrideStyle();
  document.head.insertBefore(inlineStyle, invertStyle.nextSibling);
  setupNodePositionWatcher(inlineStyle, "inline");

  const overrideStyle = createOrUpdateStyle("spotlight--override");
  overrideStyle.textContent = fixes && fixes.css ? replaceCSSTemplates(fixes.css) : "";
  document.head.appendChild(overrideStyle);
  setupNodePositionWatcher(overrideStyle, "override");

  const variableStyle = createOrUpdateStyle("spotlight--variables");
  const selectionColors = getSelectionColor(filter);
  const {
    darkSchemeBackgroundColor,
    darkSchemeTextColor,
    lightSchemeBackgroundColor,
    lightSchemeTextColor,
    mode,
  } = filter;
  let schemeBackgroundColor = mode === 0 ? lightSchemeBackgroundColor : darkSchemeBackgroundColor;
  let schemeTextColor = mode === 0 ? lightSchemeTextColor : darkSchemeTextColor;
  schemeBackgroundColor = modifyBackgroundColor(parseColorWithCache(schemeBackgroundColor), filter);
  schemeTextColor = modifyForegroundColor(parseColorWithCache(schemeTextColor), filter);
  variableStyle.textContent = [
    `:root {`,
    `   --spotlight-neutral-background: ${schemeBackgroundColor};`,
    `   --spotlight-neutral-text: ${schemeTextColor};`,
    `   --spotlight-selection-background: ${selectionColors.backgroundColorSelection};`,
    `   --spotlight-selection-text: ${selectionColors.foregroundColorSelection};`,
    `}`,
  ].join("\n");
  document.head.insertBefore(variableStyle, inlineStyle.nextSibling);
  setupNodePositionWatcher(variableStyle, "variables");

  const rootVarsStyle = createOrUpdateStyle("spotlight--root-vars");
  document.head.insertBefore(rootVarsStyle, variableStyle.nextSibling);

  //Media Grayscale
  if (filter.imgGrayscale || filter.videoGrayscale) {
    const darkenMediaCSS = createOrUpdateStyle("spotlight--media", document);
    // console.log("True");

    darkenMediaCSS.textContent = `${
      filter.imgGrayscale ? `img{filter: grayscale(${filter.imgGrayscalePercent})}` : ""
    }${
      filter.videoGrayscale
        ? `video, .wp-block-embed-youtube, .wp-block-embed[data-title="YouTube"]{filter: grayscale(${filter.videoGrayscalePercent})}`
        : ""
    }`;
    document.head.insertBefore(darkenMediaCSS, rootVarsStyle.nextSibling);
    setupNodePositionWatcher(darkenMediaCSS, "media");
  }
}

function runDynamicStyle() {
  createDynamicStyleOverrides();
  // watchForUpdates();
}

function createThemeAndWatchForUpdates() {
  createStaticStyleOverrides();

  if (!documentIsVisible() && !filter.immediateModify) {
    setDocumentVisibilityListener(runDynamicStyle);
  } else {
    runDynamicStyle();
  }
  // changeMetaThemeColorWhenAvailable(filter);
}

//Main Func
export function run_createThemeAndWatchForUpdates(config) {
  filter = { ...filter, ...config };
  createThemeAndWatchForUpdates();
}

let loadingStylesCounter = 0;
const loadingStyles = new Set();

function createManager(element) {
  const loadingStyleId = ++loadingStylesCounter;
  // logInfo(`New manager for element, with loadingStyleID ${loadingStyleId}`, element);

  function loadingStart() {
    if (!isDOMReady() || !documentIsVisible()) {
      loadingStyles.add(loadingStyleId);
      // logInfo(`Current amount of styles loading: ${loadingStyles.size}`);

      const fallbackStyle = document.querySelector(".spotlight--fallback");
      if (!fallbackStyle.textContent) {
        fallbackStyle.textContent = getModifiedFallbackStyle(filter, {
          strict: false,
        });
      }
    }
  }

  function loadingEnd() {
    loadingStyles.delete(loadingStyleId);
    // logInfo(`Removed loadingStyle ${loadingStyleId}, now awaiting: ${loadingStyles.size}`);
    // logInfo(`To-do to be loaded`, loadingStyles);

    // if (loadingStyles.size === 0 && isDOMReady()) {
    if (loadingStyles.size === 0) {
      cleanFallbackStyle();
    }
  }

  function update() {
    const details = manager.details({ secondRound: true });
    if (!details) {
      return;
    }
    variablesStore.addRulesForMatching(details.rules);
    variablesStore.matchVariablesAndDependants();
    manager.render(filter, ignoredImageAnalysisSelectors);
  }

  const manager = manageStyle(element, { update, loadingStart, loadingEnd });
  styleManagers.set(element, manager);

  return manager;
}

function createDynamicStyleOverrides() {
  const allStyles = getManageableStyles(document);

  const newManagers = allStyles
    .filter((style) => !styleManagers.has(style))
    .map((style) => createManager(style));
  newManagers
    .map((manager) => manager.details({ secondRound: false }))
    .filter((detail) => detail && detail.rules.length > 0)
    .forEach((detail) => {
      variablesStore.addRulesForMatching(detail.rules);
    });

  variablesStore.matchVariablesAndDependants();
  variablesStore.setOnRootVariableChange(() => {
    const rootVarsStyle = createOrUpdateStyle("spotlight--root-vars");
    variablesStore.putRootVars(rootVarsStyle, filter);
  });
  const rootVarsStyle = createOrUpdateStyle("spotlight--root-vars");
  variablesStore.putRootVars(rootVarsStyle, filter);

  styleManagers.forEach((manager) => manager.render(filter, ignoredImageAnalysisSelectors));

  if (loadingStyles.size === 0) {
    cleanFallbackStyle();
  }
  newManagers.forEach((manager) => manager.watch());

  const inlineStyleElements = toArray(document.querySelectorAll(INLINE_STYLE_SELECTOR));
  iterateShadowHosts(document.documentElement, (host) => {
    createShadowStaticStyleOverrides(host.shadowRoot);
    const elements = host.shadowRoot.querySelectorAll(INLINE_STYLE_SELECTOR);
    if (elements.length > 0) {
      push(inlineStyleElements, elements);
    }
  });
  inlineStyleElements.forEach((el) =>
    overrideInlineStyle(el, filter, ignoredInlineSelectors, ignoredImageAnalysisSelectors)
  );
  // handleAdoptedStyleSheets(document);
}

function cleanFallbackStyle() {
  const fallback = document.querySelector(".spotlight--fallback");
  if (fallback) {
    fallback.textContent = "";
  }
}

function replaceCSSTemplates($cssText) {
  return $cssText.replace(/\${(.+?)}/g, (_, $color) => {
    const color = parseColorWithCache($color);
    if (color) {
      return modifyColor(color, filter);
    }
    // logWarn("Couldn't parse CSSTemplate's color.");
    return $color;
  });
}

function createShadowStaticStyleOverrides(root) {
  // The shadow DOM may not be populated yet and the custom element implementation
  // may assume that unpopulated shadow root is empty and inadvertently remove
  // Dark Reader's overrides
  const uninit = root.firstChild === null;
  createShadowStaticStyleOverridesInner(root);
  if (uninit) {
    delayedCreateShadowStaticStyleOverrides(root);
  }
}

const shadowRootsWithOverrides = new Set();

function createShadowStaticStyleOverridesInner(root) {
  const inlineStyle = createOrUpdateStyle("spotlight--inline", root);
  inlineStyle.textContent = getInlineOverrideStyle();
  root.insertBefore(inlineStyle, root.firstChild);
  const overrideStyle = createOrUpdateStyle("spotlight--override", root);
  overrideStyle.textContent = fixes && fixes.css ? replaceCSSTemplates(fixes.css) : "";
  root.insertBefore(overrideStyle, inlineStyle.nextSibling);

  const invertStyle = createOrUpdateStyle("spotlight--invert", root);
  if (fixes && Array.isArray(fixes.invert) && fixes.invert.length > 0) {
    invertStyle.textContent = [
      `${fixes.invert.join(", ")} {`,
      `    filter: ${getCSSFilterValue({
        ...filter,
        contrast: filter.mode === 0 ? filter.contrast : clamp(filter.contrast - 10, 0, 100),
      })} !important;`,
      "}",
    ].join("\n");
  } else {
    invertStyle.textContent = "";
  }
  root.insertBefore(invertStyle, overrideStyle.nextSibling);
  shadowRootsWithOverrides.add(root);
}

function delayedCreateShadowStaticStyleOverrides(root) {
  const observer = new MutationObserver((mutations, observer) => {
    // Disconnect observer immediatelly before making any other changes
    observer.disconnect();

    // Do not make any changes unless Dark Reader's fixes have been removed
    for (const { type, removedNodes } of mutations) {
      if (type === "childList") {
        for (const { nodeName, className } of removedNodes) {
          if (
            nodeName === "STYLE" &&
            [
              "spotlight spotlight--inline",
              "spotlight spotlight--override",
              "spotlight spotlight--invert",
            ].includes(className)
          ) {
            createShadowStaticStyleOverridesInner(root);
            return;
          }
        }
      }
    }
  });
  observer.observe(root, { childList: true });
}

//remove styles

function removeManager(element) {
  const manager = styleManagers.get(element);
  if (manager) {
    manager.destroy();
    styleManagers.delete(element);
  }
}

const throttledRenderAllStyles = throttle((callback) => {
  styleManagers.forEach((manager) => manager.render(filter, ignoredImageAnalysisSelectors));
  adoptedStyleManagers.forEach((manager) => manager.render(filter, ignoredImageAnalysisSelectors));
  callback && callback();
});

const cancelRendering = function () {
  throttledRenderAllStyles.cancel();
};

let metaObserver;

export function removeDynamicTheme() {
  document.documentElement.removeAttribute(`data-spotlight-mode`);
  document.documentElement.removeAttribute(`data-spotlight-scheme`);
  cleanDynamicThemeCache();
  removeNode(document.querySelector(".spotlight--fallback"));
  if (document.head) {
    // restoreMetaThemeColor();
    removeNode(document.head.querySelector(".spotlight--user-agent"));
    removeNode(document.head.querySelector(".spotlight--text"));
    removeNode(document.head.querySelector(".spotlight--invert"));
    removeNode(document.head.querySelector(".spotlight--inline"));
    removeNode(document.head.querySelector(".spotlight--override"));
    removeNode(document.head.querySelector(".spotlight--variables"));
    removeNode(document.head.querySelector(".spotlight--root-vars"));
    removeNode(document.head.querySelector('meta[name="spotlight"]'));
    // removeProxy();
  }
  shadowRootsWithOverrides.forEach((root) => {
    removeNode(root.querySelector(".spotlight--inline"));
    removeNode(root.querySelector(".spotlight--override"));
  });
  shadowRootsWithOverrides.clear();
  forEach(styleManagers.keys(), (el) => removeManager(el));

  loadingStyles.clear();

  // cleanLoadingLinks();
  // forEach(document.querySelectorAll(".spotlight"), removeNode);
  // adoptedStyleManagers.forEach((manager) => {
  //     manager.destroy();
  // });
  // adoptedStyleManagers.splice(0);
  // metaObserver && metaObserver.disconnect();
}

export function cleanDynamicThemeCache() {
  variablesStore.clear();
  parsedURLCache.clear();
  removeDocumentVisibilityListener();
  cancelRendering();
  stopWatchingForUpdates();
  cleanModificationCache();
  clearColorCache();
}

function stopWatchingForUpdates() {
  styleManagers.forEach((manager) => manager.pause());
  stopStylePositionWatchers();
  stopWatchingForStyleChanges();
  stopWatchingForInlineStyles();
  removeDOMReadyListener(onDOMReady);
  cleanReadyStateCompleteListeners();
}

function stopStylePositionWatchers() {
  forEach(nodePositionWatchers.values(), (watcher) => watcher.stop());
  nodePositionWatchers.clear();
}

function onDOMReady() {
  if (loadingStyles.size === 0) {
    cleanFallbackStyle();
    return;
  }
  // logWarn(`DOM is ready, but still have styles being loaded.`, loadingStyles);
}
