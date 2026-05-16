import { forEach } from "../../utils/array";
import { isFirefox, isSafari, isShadowDomSupported } from "../../utils/platform";
import { isRelativeHrefOnAbsolutePath } from "../../utils/url";
import { iterateShadowHosts, removeNode, watchForNodePosition } from "../utils/dom";
// import { logInfo, logWarn } from "../utils/log";
import { cssImportRegex } from "./css-rules";
import { createStyleSheetModifier } from "./stylesheet-modifier";

const rejectorsForLoadingLinks = new Map();

export const STYLE_SELECTOR = 'style, link[rel*="stylesheet" i]:not([disabled])';

let loadingLinkCounter = 0;

// isFontsGoogleApiStyle returns is the given link element is a style from
// google fonts.
function isFontsGoogleApiStyle(element) {
  if (!element.href) {
    return false;
  }

  try {
    const elementURL = new URL(element.href);
    return elementURL.hostname === "fonts.googleapis.com";
  } catch (err) {
    // logInfo(`Couldn't construct ${element.href} as URL`);
    return false;
  }
}

export function shouldManageStyle(element) {
  return (
    (element instanceof HTMLStyleElement ||
      element instanceof SVGStyleElement ||
      (element instanceof HTMLLinkElement &&
        Boolean(element.rel) &&
        element.rel.toLowerCase().includes("stylesheet") &&
        Boolean(element.href) &&
        !element.disabled &&
        (isFirefox ? !element.href.startsWith("moz-extension://") : true) &&
        !isFontsGoogleApiStyle(element))) &&
    !element.classList.contains("spotlight") &&
    element.media.toLowerCase() !== "print" &&
    !element.classList.contains("stylus")
  );
}

export function getManageableStyles(node, results = [], deep = true) {
  if (shouldManageStyle(node)) {
    results.push(node);
  } else if (
    node instanceof Element ||
    (isShadowDomSupported && node instanceof ShadowRoot) ||
    node === document
  ) {
    forEach(node.querySelectorAll(STYLE_SELECTOR), (style) =>
      getManageableStyles(style, results, false)
    );
    if (deep) {
      iterateShadowHosts(node, (host) => getManageableStyles(host.shadowRoot, results, false));
    }
  }
  return results;
}

const syncStyleSet = new WeakSet();
const corsStyleSet = new WeakSet();

export function manageStyle(element, { update, loadingStart, loadingEnd }) {
  const prevStyles = [];
  let next = element;

  while ((next = next.nextElementSibling) && next.matches(".spotlight")) {
    prevStyles.push(next);
  }

  let corsCopy =
    prevStyles.find((el) => el.matches(".spotlight--cors") && !corsStyleSet.has(el)) || null;
  let syncStyle =
    prevStyles.find((el) => el.matches(".spotlight--sync") && !syncStyleSet.has(el)) || null;

  let corsCopyPositionWatcher = null;
  let syncStylePositionWatcher = null;

  let cancelAsyncOperations = false;
  let isOverrideEmpty = true;

  const sheetModifier = createStyleSheetModifier();

  const observer = new MutationObserver(() => {
    update();
  });
  const observerOptions = {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true,
  };

  function containsCSSImport() {
    return element instanceof HTMLStyleElement && element.textContent.trim().match(cssImportRegex);
  }

  // It loops trough the cssRules and check for CSSImportRule and their `href`.
  // If the `href` isn't local and doesn't start with the same-origin.
  // We can be ensure that's a cross-origin import
  // And should add a cors-sheet to this element.
  function hasImports(cssRules, checkCrossOrigin) {
    let result = false;
    if (cssRules) {
      let rule;
      cssRulesLoop: for (let i = 0, len = cssRules.length; i < len; i++) {
        rule = cssRules[i];
        if (rule.href) {
          if (checkCrossOrigin) {
            if (
              !rule.href.startsWith("https://fonts.googleapis.com/") &&
              rule.href.startsWith("http") &&
              !rule.href.startsWith(location.origin)
            ) {
              result = true;
              break cssRulesLoop;
            }
          } else {
            result = true;
            break cssRulesLoop;
          }
        }
      }
    }
    return result;
  }

  function getRulesSync() {
    if (corsCopy) {
      // logInfo("[getRulesSync] Using cors-copy.");
      return corsCopy.sheet.cssRules;
    }
    if (containsCSSImport()) {
      // logInfo("[getRulesSync] CSSImport detected.");
      return null;
    }

    const cssRules = safeGetSheetRules();
    if (
      element instanceof HTMLLinkElement &&
      !isRelativeHrefOnAbsolutePath(element.href) &&
      hasImports(cssRules, false)
    ) {
      // logInfo("[getRulesSync] CSSImportRule detected on non-local href.");
      return null;
    }

    if (hasImports(cssRules, true)) {
      // logInfo("[getRulesSync] Cross-Origin CSSImportRule detected.");
      return null;
    }

    // logInfo("[getRulesSync] Using cssRules.");
    // !cssRules && logWarn("[getRulesSync] cssRules is null, trying again.");
    return cssRules;
  }

  function insertStyle() {
    if (corsCopy) {
      if (element.nextSibling !== corsCopy) {
        element.parentNode.insertBefore(corsCopy, element.nextSibling);
      }
      if (corsCopy.nextSibling !== syncStyle) {
        element.parentNode.insertBefore(syncStyle, corsCopy.nextSibling);
      }
    } else if (element.nextSibling !== syncStyle) {
      element.parentNode.insertBefore(syncStyle, element.nextSibling);
    }
  }

  function createSyncStyle() {
    syncStyle =
      element instanceof SVGStyleElement
        ? document.createElementNS("http://www.w3.org/2000/svg", "style")
        : document.createElement("style");
    syncStyle.classList.add("spotlight");
    syncStyle.classList.add("spotlight--sync");
    syncStyle.media = "screen";
    if (element.title) {
      syncStyle.title = element.title;
    }
    syncStyleSet.add(syncStyle);
  }

  let isLoadingRules = false;
  let wasLoadingError = false;
  const loadingLinkId = ++loadingLinkCounter;

  async function getRulesAsync() {
    let cssText;
    let cssBasePath;

    if (element instanceof HTMLLinkElement) {
      let [cssRules, accessError] = getRulesOrError();
      if (accessError) {
        // logWarn(accessError);
      }

      if (
        (isSafari && !element.sheet) ||
        (!isSafari && !cssRules && !accessError) ||
        isStillLoadingError(accessError)
      ) {
        try {
          // logInfo(
          //     `Linkelement ${loadingLinkId} is not loaded yet and thus will be await for`,
          //     element
          // );
          await linkLoading(element, loadingLinkId);
        } catch (err) {
          // NOTE: Some @import resources can fail,
          // but the style sheet can still be valid.
          // There's no way to get the actual error.
          // logWarn(err);
          wasLoadingError = true;
        }
        if (cancelAsyncOperations) {
          return null;
        }

        [cssRules, accessError] = getRulesOrError();
        if (accessError) {
          // CORS error, cssRules are not accessible
          // for cross-origin resources
          // logWarn(accessError);
        }
      }

      if (cssRules) {
        if (!hasImports(cssRules, false)) {
          return cssRules;
        }
      }

      // cssText = await loadText(element.href);
      // cssBasePath = getCSSBaseBath(element.href);
      // if (cancelAsyncOperations) {
      //     return null;
      // }
    } else if (containsCSSImport()) {
      cssText = element.textContent.trim();
      cssBasePath = getCSSBaseBath(location.href);
    } else {
      return null;
    }

    if (cssText) {
      // Sometimes cross-origin stylesheets are protected from direct access
      // so need to load CSS text and insert it into style element
      try {
        const fullCSSText = await replaceCSSImports(cssText, cssBasePath);
        corsCopy = createCORSCopy(element, fullCSSText);
      } catch (err) {
        // logWarn(err);
      }
      if (corsCopy) {
        corsCopyPositionWatcher = watchForNodePosition(corsCopy, "prev-sibling");
        return corsCopy.sheet.cssRules;
      }
    }

    return null;
  }

  function details(options) {
    const rules = getRulesSync();
    if (!rules) {
      // secondRound is only true after it's
      // has gone trough `details()` & `getRulesAsync` already
      // So that means that `getRulesSync` shouldn't fail.
      // However as a fail-safe to prevent loops, we should
      // return null here and not continue to `getRulesAsync`
      if (options.secondRound) {
        // logWarn("Detected dead-lock at details(), returning early to prevent it.");
        return null;
      }
      if (isLoadingRules || wasLoadingError) {
        return null;
      }
      isLoadingRules = true;
      loadingStart();
      getRulesAsync()
        .then((results) => {
          isLoadingRules = false;
          loadingEnd();
          if (results) {
            update();
          }
        })
        .catch((err) => {
          // logWarn(err);
          isLoadingRules = false;
          loadingEnd();
        });
      return null;
    }
    return { rules };
  }

  let forceRenderStyle = false;

  function render(theme, ignoreImageAnalysis) {
    const rules = getRulesSync();
    if (!rules) {
      return;
    }

    cancelAsyncOperations = false;

    function removeCSSRulesFromSheet(sheet) {
      if (!sheet) {
        return;
      }
      for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
        sheet.deleteRule(i);
      }
    }

    function prepareOverridesSheet() {
      if (!syncStyle) {
        createSyncStyle();
      }

      syncStylePositionWatcher && syncStylePositionWatcher.stop();
      insertStyle();

      // Firefox issue: Some websites get CSP warning,
      // when `textContent` is not set (e.g. pypi.org).
      // But for other websites (e.g. facebook.com)
      // some images disappear when `textContent`
      // is initially set to an empty string.
      if (syncStyle.sheet == null) {
        syncStyle.textContent = "";
      }

      const sheet = syncStyle.sheet;

      removeCSSRulesFromSheet(sheet);

      if (syncStylePositionWatcher) {
        syncStylePositionWatcher.run();
      } else {
        syncStylePositionWatcher = watchForNodePosition(syncStyle, "prev-sibling", () => {
          forceRenderStyle = true;
          buildOverrides();
        });
      }

      return syncStyle.sheet;
    }

    function buildOverrides() {
      const force = forceRenderStyle;
      forceRenderStyle = false;
      sheetModifier.modifySheet({
        prepareSheet: prepareOverridesSheet,
        sourceCSSRules: rules,
        theme,
        ignoreImageAnalysis,
        force,
        isAsyncCancelled: () => cancelAsyncOperations,
      });
      isOverrideEmpty = syncStyle.sheet.cssRules.length === 0;
      if (sheetModifier.shouldRebuildStyle()) {
        // "update" function schedules rebuilding the style
        // ideally to wait for link loading, because some sites put links any time,
        // but it can be complicated, so waiting for document completion can do the trick
        addReadyStateCompleteListener(() => update());
      }
    }

    buildOverrides();
  }

  function getRulesOrError() {
    try {
      if (element.sheet == null) {
        return [null, null];
      }
      return [element.sheet.cssRules, null];
    } catch (err) {
      return [null, err];
    }
  }

  // NOTE: In Firefox, when link is loading,
  // `sheet` property is not null,
  // but `cssRules` access error is thrown
  function isStillLoadingError(error) {
    return error && error.message && error.message.includes("loading");
  }

  // Seems like Firefox bug: silent exception is produced
  // without any notice, when accessing <style> CSS rules
  function safeGetSheetRules() {
    const [cssRules, err] = getRulesOrError();
    if (err) {
      // logWarn(err);
      return null;
    }
    return cssRules;
  }

  function watchForSheetChanges() {
    watchForSheetChangesUsingProxy();
    // Sometimes sheet can be null in Firefox and Safari
    // So need to watch for it using rAF

    // if (!__THUNDERBIRD__ && !(canOptimizeUsingProxy && element.sheet)) {
    //     watchForSheetChangesUsingRAF();
    // }
  }

  // let rulesChangeKey = null;
  let rulesCheckFrameId = null;

  // function getRulesChangeKey() {
  //     const rules = safeGetSheetRules();
  //     return rules ? rules.length : null;
  // }

  // function didRulesKeyChange() {
  //     return getRulesChangeKey() !== rulesChangeKey;
  // }

  // function watchForSheetChangesUsingRAF() {
  //     rulesChangeKey = getRulesChangeKey();
  //     stopWatchingForSheetChangesUsingRAF();
  //     const checkForUpdate = () => {
  //         if (didRulesKeyChange()) {
  //             rulesChangeKey = getRulesChangeKey();
  //             update();
  //         }
  //         if (canOptimizeUsingProxy && element.sheet) {
  //             stopWatchingForSheetChangesUsingRAF();
  //             return;
  //         }
  //         rulesCheckFrameId = requestAnimationFrame(checkForUpdate);
  //     };

  //     checkForUpdate();
  // }

  function stopWatchingForSheetChangesUsingRAF() {
    // TODO: reove cast once types are updated
    cancelAnimationFrame(rulesCheckFrameId);
  }

  let areSheetChangesPending = false;

  function onSheetChange() {
    canOptimizeUsingProxy = true;
    stopWatchingForSheetChangesUsingRAF();
    if (areSheetChangesPending) {
      return;
    }

    function handleSheetChanges() {
      areSheetChangesPending = false;
      if (cancelAsyncOperations) {
        return;
      }
      update();
    }

    areSheetChangesPending = true;
    if (typeof queueMicrotask === "function") {
      queueMicrotask(handleSheetChanges);
    } else {
      requestAnimationFrame(handleSheetChanges);
    }
  }

  function watchForSheetChangesUsingProxy() {
    element.addEventListener("__darken__updateSheet", onSheetChange, {
      passive: true,
    });
  }

  function stopWatchingForSheetChangesUsingProxy() {
    element.removeEventListener("__darken__updateSheet", onSheetChange);
  }

  function stopWatchingForSheetChanges() {
    stopWatchingForSheetChangesUsingProxy();
    stopWatchingForSheetChangesUsingRAF();
  }

  function pause() {
    observer.disconnect();
    cancelAsyncOperations = true;
    corsCopyPositionWatcher && corsCopyPositionWatcher.stop();
    syncStylePositionWatcher && syncStylePositionWatcher.stop();
    stopWatchingForSheetChanges();
  }

  function destroy() {
    pause();
    removeNode(corsCopy);
    removeNode(syncStyle);
    loadingEnd();
    if (rejectorsForLoadingLinks.has(loadingLinkId)) {
      const reject = rejectorsForLoadingLinks.get(loadingLinkId);
      rejectorsForLoadingLinks.delete(loadingLinkId);
      reject && reject();
    }
  }

  function watch() {
    observer.observe(element, observerOptions);
    if (element instanceof HTMLStyleElement) {
      watchForSheetChanges();
    }
  }

  const maxMoveCount = 10;
  let moveCount = 0;

  function restore() {
    if (!syncStyle) {
      return;
    }

    moveCount++;
    if (moveCount > maxMoveCount) {
      // logWarn("Style sheet was moved multiple times", element);
      return;
    }

    // logWarn("Restore style", syncStyle, element);
    insertStyle();
    corsCopyPositionWatcher && corsCopyPositionWatcher.skip();
    syncStylePositionWatcher && syncStylePositionWatcher.skip();
    if (!isOverrideEmpty) {
      forceRenderStyle = true;
      update();
    }
  }

  return {
    details,
    render,
    pause,
    destroy,
    watch,
    restore,
  };
}

export function cleanLoadingLinks() {
  rejectorsForLoadingLinks.clear();
}
