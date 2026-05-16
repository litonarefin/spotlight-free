import { isIPV6, compareIPV6 } from "./ipv6";

let anchor;

export const parsedURLCache = new Map();

function fixBaseURL($url) {
    if (!anchor) {
        anchor = document.createElement("a");
    }
    anchor.href = $url;
    return anchor.href;
}

export function parseURL($url, $base = null) {
    const key = `${$url}${$base ? `;${$base}` : ""}`;
    if (parsedURLCache.has(key)) {
        return parsedURLCache.get(key);
    }
    if ($base) {
        const parsedURL = new URL($url, fixBaseURL($base));
        parsedURLCache.set(key, parsedURL);
        return parsedURL;
    }
    const parsedURL = new URL(fixBaseURL($url));
    parsedURLCache.set($url, parsedURL);
    return parsedURL;
}

export function getAbsoluteURL($base, $relative) {
    if ($relative.match(/^data\\?\:/)) {
        return $relative;
    }
    // Check if relative starts with `//hostname...`.
    // We have to add a protocol to make it absolute.
    if (/^\/\//.test($relative)) {
        return `${location.protocol}${$relative}`;
    }
    const b = parseURL($base);
    const a = parseURL($relative, b.href);
    return a.href;
}

// Check if any relative URL is on the window.location;
// So that https://duck.com/ext.css would return true on https://duck.com/
// But https://duck.com/styles/ext.css would return false on https://duck.com/
// Visa versa https://duck.com/ext.css should return fasle on https://duck.com/search/
// We're checking if any relative value within ext.css could potentially not be on the same path.
export function isRelativeHrefOnAbsolutePath(href) {
    if (href.startsWith("data:")) {
        return true;
    }
    const url = parseURL(href);

    if (url.protocol !== location.protocol) {
        return false;
    }
    if (url.hostname !== location.hostname) {
        return false;
    }
    if (url.port !== location.port) {
        return false;
    }
    // Now check if the path is on the same path as the base
    // We do this by getting the pathname up until the last slash.
    return url.pathname === location.pathname;
}

// export function getURLHostOrProtocol($url) {
//     const url = new URL($url);
//     if (url.host) {
//         return url.host;
//     } else if (url.protocol === "file:") {
//         return url.pathname;
//     }
//     return url.protocol;
// }

export function compareURLPatterns(a, b) {
    return a.localeCompare(b);
}

/**
 * Determines whether URL has a match in URL template list.
 * @param url Site URL.
 * @paramlist List to search into.
 */
export function isURLInList(url, list) {
    for (let i = 0; i < list.length; i++) {
        if (isURLMatched(url, list[i])) {
            return true;
        }
    }
    return false;
}

/**
 * Determines whether URL matches the template.
 * @param url URL.
 * @param urlTemplate URL template ("google.*", "youtube.com" etc).
 */
export function isURLMatched(url, urlTemplate) {
    const isFirstIPV6 = isIPV6(url);
    const isSecondIPV6 = isIPV6(urlTemplate);
    if (isFirstIPV6 && isSecondIPV6) {
        return compareIPV6(url, urlTemplate);
    } else if (!isFirstIPV6 && !isSecondIPV6) {
        const regex = createUrlRegex(urlTemplate);
        return regex !== null && Boolean(url.match(regex));
    }
    return false;
}

function createUrlRegex(urlTemplate) {
    try {
        urlTemplate = urlTemplate.trim();
        const exactBeginning = urlTemplate[0] === "^";
        const exactEnding = urlTemplate[urlTemplate.length - 1] === "$";
        const hasLastSlash = /\/\$?$/.test(urlTemplate);

        urlTemplate = urlTemplate
            .replace(/^\^/, "") // Remove ^ at start
            .replace(/\$$/, "") // Remove $ at end
            .replace(/^.*?\/{2,3}/, "") // Remove scheme
            .replace(/\?.*$/, "") // Remove query
            .replace(/\/$/, ""); // Remove last slash

        let slashIndex;
        let beforeSlash;
        let afterSlash;
        if ((slashIndex = urlTemplate.indexOf("/")) >= 0) {
            beforeSlash = urlTemplate.substring(0, slashIndex); // google.*
            afterSlash = urlTemplate.replace(/\$/g, "").substring(slashIndex); // /login/abc
        } else {
            beforeSlash = urlTemplate.replace(/\$/g, "");
        }

        //
        // SCHEME and SUBDOMAINS

        let result = exactBeginning
            ? "^(.*?\\:\\/{2,3})?" // Scheme
            : "^(.*?\\:\\/{2,3})?([^/]*?\\.)?"; // Scheme and subdomains

        //
        // HOST and PORT

        const hostParts = beforeSlash.split(".");
        result += "(";
        for (let i = 0; i < hostParts.length; i++) {
            if (hostParts[i] === "*") {
                hostParts[i] = "[^\\.\\/]+?";
            }
        }
        result += hostParts.join("\\.");
        result += ")";

        //
        // PATH and QUERY

        if (afterSlash) {
            result += "(";
            result += afterSlash.replace("/", "\\/");
            result += ")";
        }

        result += exactEnding
            ? "(\\/?(\\?[^/]*?)?)$" // All following queries
            : `(\\/${hasLastSlash ? "" : "?"}.*?)$`; // All following paths and queries

        //
        // Result

        return new RegExp(result, "i");
    } catch (e) {
        return null;
    }
}

// export function isFullyQualifiedDomain(candidate) {
//     return /^[a-z0-9\.\-]+$/i.test(candidate) && candidate.indexOf("..") === -1;
// }

export function isFullyQualifiedDomainWildcard(candidate) {
    if (!candidate.includes("*") || !/^[a-z0-9\.\-\*]+$/i.test(candidate)) {
        return false;
    }
    const labels = candidate.split(".");
    for (const label of labels) {
        if (label !== "*" && !/^[a-z0-9\-]+$/i.test(label)) {
            return false;
        }
    }
    return true;
}

export function fullyQualifiedDomainMatchesWildcard(wildcard, candidate) {
    const wildcardLabels = wildcard.toLowerCase().split(".");
    const candidateLabels = candidate.toLowerCase().split(".");
    if (candidateLabels.length < wildcardLabels.length) {
        return false;
    }
    while (wildcardLabels.length) {
        const wildcardLabel = wildcardLabels.pop();
        const candidateLabel = candidateLabels.pop();
        if (wildcardLabel !== "*" && wildcardLabel !== candidateLabel) {
            return false;
        }
    }
    return true;
}
