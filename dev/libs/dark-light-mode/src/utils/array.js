function isArrayLike(items) {
    return items.length != null;
}

// NOTE: Iterating Array-like items using `for .. of` is 3x slower in Firefox
// https://jsben.ch/kidOp
export function forEach(items, iterator) {
    if (isArrayLike(items)) {
        for (let i = 0, len = items.length; i < len; i++) {
            iterator(items[i]);
        }
    } else {
        for (const item of items) {
            iterator(item);
        }
    }
}

// NOTE: Pushing items like `arr.push(...items)` is 3x slower in Firefox
// https://jsben.ch/nr9OF
export function push(array, addition) {
    forEach(addition, (a) => array.push(a));
}

// NOTE: Using `Array.from()` is 2x (FF) — 5x (Chrome) slower for ArrayLike (not for Iterable)
// https://jsben.ch/FJ1mO
// https://jsben.ch/ZmViL
export function toArray(items) {
    const results = [];
    for (let i = 0, len = items.length; i < len; i++) {
        results.push(items[i]);
    }
    return results;
}
