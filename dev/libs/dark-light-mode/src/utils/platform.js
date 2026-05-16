export const isShadowDomSupported = typeof ShadowRoot === "function";

export const isFirefox = navigator.userAgent.indexOf("Firefox") != -1;
export const isSafari = navigator.userAgent.indexOf("Safari") != -1;

export const isCSSColorSchemePropSupported = (() => {
    try {
        if (typeof document === "undefined") {
            return false;
        }
        const el = document.createElement("div");
        if (!el || typeof el.style !== "object") {
            return false;
        }
        if (typeof el.style.colorScheme === "string") {
            return true;
        }
        // TODO: remove the following code after enforcing strong CSP in all builds
        // This feature detection method requires weak or missing CSP in manifest.json
        el.setAttribute("style", "color-scheme: dark");
        return el.style.colorScheme === "dark";
    } catch (e) {
        return false;
    }
})();

export function compareChromeVersions($a, $b) {
    const a = $a.split(".").map((x) => parseInt(x));
    const b = $b.split(".").map((x) => parseInt(x));
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return a[i] < b[i] ? -1 : 1;
        }
    }
    return 0;
}

export const chromiumVersion = (() => {
    const m = navigator.userAgent.match(/chrom(?:e|ium)(?:\/| )([^ ]+)/);
    if (m && m[1]) {
        return m[1];
    }
    return "";
})();

export const firefoxVersion = (() => {
    const m = navigator.userAgent.match(/(?:firefox|librewolf)(?:\/| )([^ ]+)/);
    if (m && m[1]) {
        return m[1];
    }
    return "";
})();
