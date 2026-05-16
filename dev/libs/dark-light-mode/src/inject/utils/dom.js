import { throttle } from "../../utils/throttle";
import { getDuration } from "../../utils/time";
// import { logWarn } from "./log";

// **important**
export function watchForNodePosition(node, mode, onRestore = Function.prototype) {
  const MAX_ATTEMPTS_COUNT = 10;
  const RETRY_TIMEOUT = getDuration({ seconds: 2 });
  const ATTEMPTS_INTERVAL = getDuration({ seconds: 10 });
  const prevSibling = node.previousSibling;
  let parent = node.parentNode;
  if (!parent) {
    throw new Error("Unable to watch for node position: parent element not found");
  }
  if (mode === "prev-sibling" && !prevSibling) {
    throw new Error("Unable to watch for node position: there is no previous sibling");
  }
  let attempts = 0;
  let start = null;
  let timeoutId = null;

  const restore = throttle(() => {
    if (timeoutId) {
      return;
    }
    attempts++;
    const now = Date.now();
    if (start == null) {
      start = now;
    } else if (attempts >= MAX_ATTEMPTS_COUNT) {
      if (now - start < ATTEMPTS_INTERVAL) {
        // logWarn(
        //     `Node position watcher paused: retry in ${RETRY_TIMEOUT}ms`,
        //     node,
        //     prevSibling
        // );
        timeoutId = setTimeout(() => {
          start = null;
          attempts = 0;
          timeoutId = null;
          restore();
        }, RETRY_TIMEOUT);
        return;
      }
      start = now;
      attempts = 1;
    }

    if (mode === "head") {
      if (prevSibling && prevSibling.parentNode !== parent) {
        // logWarn(
        //     "Unable to restore node position: sibling parent changed",
        //     node,
        //     prevSibling,
        //     parent
        // );
        stop();
        return;
      }
    }

    if (mode === "prev-sibling") {
      if (prevSibling.parentNode == null) {
        // logWarn(
        //     "Unable to restore node position: sibling was removed",
        //     node,
        //     prevSibling,
        //     parent
        // );
        stop();
        return;
      }
      if (prevSibling.parentNode !== parent) {
        // logWarn("Style was moved to another parent", node, prevSibling, parent);
        updateParent(prevSibling.parentNode);
      }
    }

    // If parent becomes disconnected from the DOM, fetches the new head and
    // save that as parent. Do this only for the head mode, as those are
    // important nodes to keep.
    if (mode === "head" && !parent.isConnected) {
      parent = document.head;
      // TODO: Set correct prevSibling, which needs to be the last `.spotlight` in <head> that isn't .spotlight--sync or .spotlight--cors.
    }

    // logWarn("Restoring node position", node, prevSibling, parent);
    parent.insertBefore(
      node,
      prevSibling && prevSibling.isConnected ? prevSibling.nextSibling : parent.firstChild
    );
    observer.takeRecords();
    onRestore && onRestore();
  });

  const observer = new MutationObserver(() => {
    if (
      (mode === "head" && (node.parentNode !== parent || !node.parentNode.isConnected)) ||
      (mode === "prev-sibling" && node.previousSibling !== prevSibling)
    ) {
      restore();
    }
  });

  const run = () => {
    // TODO: remove type cast after dependency update
    observer.observe(parent, { childList: true });
  };

  const stop = () => {
    // TODO: remove type cast after dependency update
    clearTimeout(timeoutId);
    observer.disconnect();
    restore.cancel();
  };

  const skip = () => {
    observer.takeRecords();
  };

  const updateParent = (parentNode) => {
    parent = parentNode;
    stop();
    run();
  };

  run();
  return { run, stop, skip };
}

export function iterateShadowHosts(root, iterator) {
  if (root == null) {
    return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      return node.shadowRoot == null ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
    },
  });
  for (
    let node = root.shadowRoot ? walker.currentNode : walker.nextNode();
    node != null;
    node = walker.nextNode()
  ) {
    if (node.classList.contains("surfingkeys_hints_host")) {
      continue;
    }

    iterator(node);
    iterateShadowHosts(node.shadowRoot, iterator);
  }
}

const readyStateCompleteListeners = new Set();

// `interactive` can and will be fired when their are still stylesheets loading.
// We use certain actions that can cause a forced layout change, which is bad.
export function isReadyStateComplete() {
  return document.readyState === "complete";
}

export function addReadyStateCompleteListener(listener) {
  isReadyStateComplete() ? listener() : readyStateCompleteListeners.add(listener);
}

export let isDOMReady = () => {
  return document.readyState === "complete" || document.readyState === "interactive";
};

//remove

const readyStateListeners = new Set();

export function removeNode(node) {
  node && node.parentNode && node.parentNode.removeChild(node);
}

export function removeDOMReadyListener(listener) {
  readyStateListeners.delete(listener);
}

export function cleanReadyStateCompleteListeners() {
  readyStateCompleteListeners.clear();
}
