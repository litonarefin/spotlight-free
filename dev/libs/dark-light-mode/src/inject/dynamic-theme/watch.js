const observers = [];
let observedRoots;
let elementsDefinitionCallback;
const undefinedGroups = new Map();

function resetObservers() {
    observers.forEach((o) => o.disconnect());
    observers.splice(0, observers.length);
    observedRoots = new WeakSet();
}

function handleIsDefined(e) {
    canOptimizeUsingProxy = true;
    const tag = e.detail.tag;
    ASSERT("handleIsDefined() expects lower-case node names", () => tag.toLowerCase() === tag);
    definedCustomElements.add(tag);
    if (resolvers.has(tag)) {
        const r = resolvers.get(tag);
        resolvers.delete(tag);
        r.forEach((r) => r());
    }
}

function unsubscribeFromDefineCustomElements() {
    elementsDefinitionCallback = null;
    undefinedGroups.clear();
    document.removeEventListener("__darken__isDefined", handleIsDefined);
}

export function stopWatchingForStyleChanges() {
    resetObservers();
    unsubscribeFromDefineCustomElements();
}
