import { isFirefox } from "./platform";

async function getOKResponse(url, mimeType, origin) {
    const response = await fetch(url, {
        cache: "force-cache",
        credentials: "omit",
        referrer: origin,
    });

    // Firefox bug, content type is "application/x-unknown-content-type"
    if (
        isFirefox &&
        mimeType === "text/css" &&
        url.startsWith("moz-extension://") &&
        url.endsWith(".css")
    ) {
        return response;
    }

    if (mimeType && !response.headers.get("Content-Type").startsWith(mimeType)) {
        throw new Error(`Mime type mismatch when loading ${url}`);
    }

    if (!response.ok) {
        throw new Error(`Unable to load ${url} ${response.status} ${response.statusText}`);
    }

    return response;
}

export async function loadAsDataURL(url, mimeType) {
    const response = await getOKResponse(url, mimeType);
    return await readResponseAsDataURL(response);
}

export async function readResponseAsDataURL(response) {
    const blob = await response.blob();
    const dataURL = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
    return dataURL;
}

// export async function loadAsText(url, mimeType, origin) {
//     const response = await getOKResponse(url, mimeType, origin);
//     return await response.text();
// }
