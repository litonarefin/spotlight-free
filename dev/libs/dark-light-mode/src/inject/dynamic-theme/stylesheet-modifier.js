import { createAsyncTasksQueue } from "../../utils/throttle";
import { iterateCSSRules, iterateCSSDeclarations } from "./css-rules";
import { getModifiableCSSDeclaration } from "./modify-css";
import { variablesStore } from "./variables";

const themeCacheKeys = [
    "mode",
    "brightness",
    "contrast",
    "grayscale",
    "sepia",
    "darkSchemeBackgroundColor",
    "darkSchemeTextColor",
    "lightSchemeBackgroundColor",
    "lightSchemeTextColor",
];

function getThemeKey(theme) {
    let resultKey = "";
    themeCacheKeys.forEach((key) => {
        resultKey += `${key}:${theme[key]};`;
    });
    return resultKey;
}

const asyncQueue = createAsyncTasksQueue();

export function createStyleSheetModifier() {
    let renderId = 0;
    const rulesTextCache = new Set();
    const rulesModCache = new Map();
    const varTypeChangeCleaners = new Set();
    let prevFilterKey = null;
    let hasNonLoadedLink = false;
    let wasRebuilt = false;

    function shouldRebuildStyle() {
        return hasNonLoadedLink && !wasRebuilt;
    }

    function modifySheet(options) {
        const rules = options.sourceCSSRules;
        const { theme, ignoreImageAnalysis, force, prepareSheet, isAsyncCancelled } = options;

        let rulesChanged = rulesModCache.size === 0;
        const notFoundCacheKeys = new Set(rulesModCache.keys());
        const themeKey = getThemeKey(theme);
        const themeChanged = themeKey !== prevFilterKey;

        if (hasNonLoadedLink) {
            wasRebuilt = true;
        }

        const modRules = [];
        iterateCSSRules(
            rules,
            (rule) => {
                let cssText = rule.cssText;
                let textDiffersFromPrev = false;

                notFoundCacheKeys.delete(cssText);
                if (rule.parentRule instanceof CSSMediaRule) {
                    cssText += `;${rule.parentRule.media.mediaText}`;
                }
                if (!rulesTextCache.has(cssText)) {
                    rulesTextCache.add(cssText);
                    textDiffersFromPrev = true;
                }

                if (textDiffersFromPrev) {
                    rulesChanged = true;
                } else {
                    modRules.push(rulesModCache.get(cssText));
                    return;
                }

                // A very specific case to skip. This causes a lot of calls to `getModifiableCSSDeclaration`
                // and currently contributes nothing in real-world case.
                // TODO: Allow `setRule` to throw a exception when we're modifying SVGs namespace styles.
                if (rule.style.all === "revert") {
                    return;
                }

                const modDecs = [];
                rule.style &&
                    iterateCSSDeclarations(rule.style, (property, value) => {
                        const mod = getModifiableCSSDeclaration(
                            property,
                            value,
                            rule,
                            variablesStore,
                            ignoreImageAnalysis,
                            isAsyncCancelled
                        );
                        if (mod) {
                            modDecs.push(mod);
                        }
                    });

                let modRule = null;
                if (modDecs.length > 0) {
                    const parentRule = rule.parentRule;
                    modRule = {
                        selector: rule.selectorText,
                        declarations: modDecs,
                        parentRule,
                    };
                    modRules.push(modRule);
                }
                rulesModCache.set(cssText, modRule);
            },
            () => {
                hasNonLoadedLink = true;
            }
        );

        notFoundCacheKeys.forEach((key) => {
            rulesTextCache.delete(key);
            rulesModCache.delete(key);
        });
        prevFilterKey = themeKey;

        if (!force && !rulesChanged && !themeChanged) {
            return;
        }

        renderId++;

        function setRule(target, index, rule) {
            const { selector, declarations } = rule;
            const getDeclarationText = (dec) => {
                const { property, value, important, sourceValue } = dec;
                return `${property}: ${value == null ? sourceValue : value}${
                    important ? " !important" : ""
                };`;
            };

            let cssRulesText = "";
            declarations.forEach((declarations) => {
                cssRulesText += `${getDeclarationText(declarations)} `;
            });
            const ruleText = `${selector} { ${cssRulesText} }`;
            target.insertRule(ruleText, index);
        }

        const asyncDeclarations = new Map();
        const varDeclarations = new Map();
        let asyncDeclarationCounter = 0;
        let varDeclarationCounter = 0;

        const rootReadyGroup = { rule: null, rules: [], isGroup: true };
        const groupRefs = new WeakMap();

        function getGroup(rule) {
            if (rule == null) {
                return rootReadyGroup;
            }

            if (groupRefs.has(rule)) {
                return groupRefs.get(rule);
            }

            const group = { rule, rules: [], isGroup: true };
            groupRefs.set(rule, group);

            const parentGroup = getGroup(rule.parentRule);
            parentGroup.rules.push(group);

            return group;
        }

        varTypeChangeCleaners.forEach((clear) => clear());
        varTypeChangeCleaners.clear();

        modRules
            .filter((r) => r)
            .forEach(({ selector, declarations, parentRule }) => {
                const group = getGroup(parentRule);
                const readyStyleRule = { selector, declarations: [], isGroup: false };
                const readyDeclarations = readyStyleRule.declarations;
                group.rules.push(readyStyleRule);

                function handleAsyncDeclaration(property, modified, important, sourceValue) {
                    const asyncKey = ++asyncDeclarationCounter;
                    const asyncDeclaration = {
                        property,
                        value: null,
                        important,
                        asyncKey,
                        sourceValue,
                    };
                    readyDeclarations.push(asyncDeclaration);
                    const currentRenderId = renderId;
                    modified.then((asyncValue) => {
                        if (!asyncValue || isAsyncCancelled() || currentRenderId !== renderId) {
                            return;
                        }
                        asyncDeclaration.value = asyncValue;
                        asyncQueue.add(() => {
                            if (isAsyncCancelled() || currentRenderId !== renderId) {
                                return;
                            }
                            rebuildAsyncRule(asyncKey);
                        });
                    });
                }

                function handleVarDeclarations(property, modified, important, sourceValue) {
                    const { declarations: varDecs, onTypeChange } = modified;
                    const varKey = ++varDeclarationCounter;
                    const currentRenderId = renderId;
                    const initialIndex = readyDeclarations.length;
                    let oldDecs = [];
                    if (varDecs.length === 0) {
                        const tempDec = {
                            property,
                            value: sourceValue,
                            important,
                            sourceValue,
                            varKey,
                        };
                        readyDeclarations.push(tempDec);
                        oldDecs = [tempDec];
                    }
                    varDecs.forEach((mod) => {
                        if (mod.value instanceof Promise) {
                            handleAsyncDeclaration(mod.property, mod.value, important, sourceValue);
                        } else {
                            const readyDec = {
                                property: mod.property,
                                value: mod.value,
                                important,
                                sourceValue,
                                varKey,
                            };
                            readyDeclarations.push(readyDec);
                            oldDecs.push(readyDec);
                        }
                    });
                    onTypeChange.addListener((newDecs) => {
                        if (isAsyncCancelled() || currentRenderId !== renderId) {
                            return;
                        }
                        const readyVarDecs = newDecs.map((mod) => {
                            return {
                                property: mod.property,
                                value: mod.value,
                                important,
                                sourceValue,
                                varKey,
                            };
                        });
                        // TODO: Don't search for index, store some way or use Linked List.
                        const index = readyDeclarations.indexOf(oldDecs[0], initialIndex);
                        readyDeclarations.splice(index, oldDecs.length, ...readyVarDecs);
                        oldDecs = readyVarDecs;
                        rebuildVarRule(varKey);
                    });
                    varTypeChangeCleaners.add(() => onTypeChange.removeListeners());
                }

                declarations.forEach(({ property, value, important, sourceValue }) => {
                    if (typeof value === "function") {
                        const modified = value(theme);
                        if (modified instanceof Promise) {
                            handleAsyncDeclaration(property, modified, important, sourceValue);
                        } else if (property.startsWith("--")) {
                            handleVarDeclarations(property, modified, important, sourceValue);
                        } else {
                            readyDeclarations.push({
                                property,
                                value: modified,
                                important,
                                sourceValue,
                            });
                        }
                    } else {
                        readyDeclarations.push({ property, value, important, sourceValue });
                    }
                });
            });

        const sheet = prepareSheet();

        function buildStyleSheet() {
            function createTarget(group, parent) {
                const { rule } = group;
                if (rule instanceof CSSMediaRule) {
                    const { media } = rule;
                    const index = parent.cssRules.length;
                    parent.insertRule(`@media ${media.mediaText} {}`, index);
                    return parent.cssRules[index];
                }
                return parent;
            }

            function iterateReadyRules(group, target, styleIterator) {
                group.rules.forEach((r) => {
                    if (r.isGroup) {
                        const t = createTarget(r, target);
                        iterateReadyRules(r, t, styleIterator);
                    } else {
                        styleIterator(r, target);
                    }
                });
            }

            iterateReadyRules(rootReadyGroup, sheet, (rule, target) => {
                const index = target.cssRules.length;
                rule.declarations.forEach(({ asyncKey, varKey }) => {
                    if (asyncKey != null) {
                        asyncDeclarations.set(asyncKey, { rule, target, index });
                    }
                    if (varKey != null) {
                        varDeclarations.set(varKey, { rule, target, index });
                    }
                });
                setRule(target, index, rule);
            });
        }

        function rebuildAsyncRule(key) {
            const { rule, target, index } = asyncDeclarations.get(key);
            target.deleteRule(index);
            setRule(target, index, rule);
            asyncDeclarations.delete(key);
        }

        function rebuildVarRule(key) {
            const { rule, target, index } = varDeclarations.get(key);
            target.deleteRule(index);
            setRule(target, index, rule);
        }

        buildStyleSheet();
    }

    return { modifySheet, shouldRebuildStyle };
}
