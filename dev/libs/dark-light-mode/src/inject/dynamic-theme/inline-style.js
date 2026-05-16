import { forEach } from "../../utils/array";
import { addReadyStateCompleteListener, isReadyStateComplete } from "../utils/dom";
import { iterateCSSDeclarations } from "./css-rules";
import { getModifiableCSSDeclaration } from "./modify-css";
import { variablesStore } from "./variables";

const overrides = {
  "background-color": {
    customProp: "--spotlight-inline-bgcolor",
    cssProp: "background-color",
    dataAttr: "data-spotlight-inline-bgcolor",
  },
  "background-image": {
    customProp: "--spotlight-inline-bgimage",
    cssProp: "background-image",
    dataAttr: "data-spotlight-inline-bgimage",
  },
  "border-color": {
    customProp: "--spotlight-inline-border",
    cssProp: "border-color",
    dataAttr: "data-spotlight-inline-border",
  },
  "border-bottom-color": {
    customProp: "--spotlight-inline-border-bottom",
    cssProp: "border-bottom-color",
    dataAttr: "data-spotlight-inline-border-bottom",
  },
  "border-left-color": {
    customProp: "--spotlight-inline-border-left",
    cssProp: "border-left-color",
    dataAttr: "data-spotlight-inline-border-left",
  },
  "border-right-color": {
    customProp: "--spotlight-inline-border-right",
    cssProp: "border-right-color",
    dataAttr: "data-spotlight-inline-border-right",
  },
  "border-top-color": {
    customProp: "--spotlight-inline-border-top",
    cssProp: "border-top-color",
    dataAttr: "data-spotlight-inline-border-top",
  },
  "box-shadow": {
    customProp: "--spotlight-inline-boxshadow",
    cssProp: "box-shadow",
    dataAttr: "data-spotlight-inline-boxshadow",
  },
  color: {
    customProp: "--spotlight-inline-color",
    cssProp: "color",
    dataAttr: "data-spotlight-inline-color",
  },
  fill: {
    customProp: "--spotlight-inline-fill",
    cssProp: "fill",
    dataAttr: "data-spotlight-inline-fill",
  },
  stroke: {
    customProp: "--spotlight-inline-stroke",
    cssProp: "stroke",
    dataAttr: "data-spotlight-inline-stroke",
  },
  "outline-color": {
    customProp: "--spotlight-inline-outline",
    cssProp: "outline-color",
    dataAttr: "data-spotlight-inline-outline",
  },
  "stop-color": {
    customProp: "--spotlight-inline-stopcolor",
    cssProp: "stop-color",
    dataAttr: "data-spotlight-inline-stopcolor",
  },
};

const overridesList = Object.values(overrides);
const normalizedPropList = {};
overridesList.forEach(({ cssProp, customProp }) => (normalizedPropList[customProp] = cssProp));
const INLINE_STYLE_ATTRS = ["style", "fill", "stop-color", "stroke", "bgcolor", "color"];
export const INLINE_STYLE_SELECTOR = INLINE_STYLE_ATTRS.map((attr) => `[${attr}]`).join(", ");

export function getInlineOverrideStyle() {
  return overridesList
    .map(({ dataAttr, customProp, cssProp }) => {
      return [`[${dataAttr}] {`, `  ${cssProp}: var(${customProp}) !important;`, "}"].join("\n");
    })
    .join("\n");
}

const inlineStyleCache = new WeakMap();
const filterProps = ["brightness", "contrast", "grayscale", "sepia", "mode"];

function getInlineStyleCacheKey(el, theme) {
  return INLINE_STYLE_ATTRS.map((attr) => `${attr}="${el.getAttribute(attr)}"`)
    .concat(filterProps.map((prop) => `${prop}="${theme[prop]}"`))
    .join(" ");
}

export function overrideInlineStyle(element, theme, ignoreInlineSelectors, ignoreImageSelectors) {
  const cacheKey = getInlineStyleCacheKey(element, theme);
  if (cacheKey === inlineStyleCache.get(element)) {
    return;
  }

  const unsetProps = new Set(Object.keys(overrides));

  function setCustomProp(targetCSSProp, modifierCSSProp, cssVal) {
    const isPropertyVariable = targetCSSProp.startsWith("--");
    const { customProp, dataAttr } = isPropertyVariable ? {} : overrides[targetCSSProp];

    const mod = getModifiableCSSDeclaration(
      modifierCSSProp,
      cssVal,
      {
        style: element.style,
      },
      variablesStore,
      ignoreImageSelectors,
      null
    );
    if (!mod) {
      return;
    }
    let value = mod.value;
    if (typeof value === "function") {
      value = value(theme);
    }

    // typeof value === 'object' always evaluate to true when
    // `isPropertyVariable` is true, but it serves as a type hint for typescript.
    // Such that `as ReturnType<CSSVariableModifier>` won't error about the possible
    // string type.
    if (isPropertyVariable && typeof value === "object") {
      const typedValue = value;
      typedValue.declarations.forEach(({ property, value }) => {
        !(value instanceof Promise) && element.style.setProperty(property, value);
      });

      // TODO: add listener for `onTypeChange`.
    } else {
      element.style.setProperty(customProp, value);
      if (!element.hasAttribute(dataAttr)) {
        element.setAttribute(dataAttr, "");
      }
      unsetProps.delete(targetCSSProp);
    }
  }

  if (ignoreInlineSelectors.length > 0) {
    if (shouldIgnoreInlineStyle(element, ignoreInlineSelectors)) {
      unsetProps.forEach((cssProp) => {
        element.removeAttribute(overrides[cssProp].dataAttr);
      });
      return;
    }
  }

  if (element.hasAttribute("bgcolor")) {
    let value = element.getAttribute("bgcolor");
    if (value.match(/^[0-9a-f]{3}$/i) || value.match(/^[0-9a-f]{6}$/i)) {
      value = `#${value}`;
    }
    setCustomProp("background-color", "background-color", value);
  }

  // We can catch some link elements here, that are from `<link rel="mask-icon" color="#000000">`.
  // It's valid HTML code according to the specs, https://html.spec.whatwg.org/#attr-link-color
  // We don't want to touch such links, as it cause weird browser behavior (silent DOMException).
  if (element.hasAttribute("color") && element.rel !== "mask-icon") {
    let value = element.getAttribute("color");
    if (value.match(/^[0-9a-f]{3}$/i) || value.match(/^[0-9a-f]{6}$/i)) {
      value = `#${value}`;
    }
    setCustomProp("color", "color", value);
  }
  if (element instanceof SVGElement) {
    if (element.hasAttribute("fill")) {
      const SMALL_SVG_LIMIT = 32;
      const value = element.getAttribute("fill");
      if (value !== "none") {
        if (!(element instanceof SVGTextElement)) {
          // getBoundingClientRect forces a layout change. And when it happens and
          // the DOM is not in the `complete` readystate, it will cause the layout to be drawn
          // and it will cause a layout of unstyled content which results in white flashes.
          // Therefore, check if the DOM is at the `complete` readystate.
          const handleSVGElement = () => {
            const { width, height } = element.getBoundingClientRect();
            const isBg = width > SMALL_SVG_LIMIT || height > SMALL_SVG_LIMIT;
            setCustomProp("fill", isBg ? "background-color" : "color", value);
          };

          if (isReadyStateComplete()) {
            handleSVGElement();
          } else {
            addReadyStateCompleteListener(handleSVGElement);
          }
        } else {
          setCustomProp("fill", "color", value);
        }
      }
    }
    if (element.hasAttribute("stop-color")) {
      setCustomProp("stop-color", "background-color", element.getAttribute("stop-color"));
    }
  }
  if (element.hasAttribute("stroke")) {
    const value = element.getAttribute("stroke");
    setCustomProp(
      "stroke",
      element instanceof SVGLineElement || element instanceof SVGTextElement
        ? "border-color"
        : "color",
      value
    );
  }
  element.style &&
    iterateCSSDeclarations(element.style, (property, value) => {
      // Temporarily ignore background images due to the possible performance
      // issues and complexity of handling async requests.
      if (property === "background-image" && value.includes("url")) {
        return;
      }
      if (
        overrides.hasOwnProperty(property) ||
        (property.startsWith("--") && !normalizedPropList[property])
      ) {
        setCustomProp(property, property, value);
      } else {
        const overridenProp = normalizedPropList[property];
        if (
          overridenProp &&
          !element.style.getPropertyValue(overridenProp) &&
          !element.hasAttribute(overridenProp)
        ) {
          if (overridenProp === "background-color" && element.hasAttribute("bgcolor")) {
            return;
          }
          element.style.setProperty(property, "");
        }
      }
    });
  if (element.style && element instanceof SVGTextElement && element.style.fill) {
    setCustomProp("fill", "color", element.style.getPropertyValue("fill"));
  }

  forEach(unsetProps, (cssProp) => {
    element.removeAttribute(overrides[cssProp].dataAttr);
  });
  inlineStyleCache.set(element, getInlineStyleCacheKey(element, theme));
}

const treeObservers = new Map();
const attrObservers = new Map();

export function stopWatchingForInlineStyles() {
  treeObservers.forEach((o) => o.disconnect());
  attrObservers.forEach((o) => o.disconnect());
  treeObservers.clear();
  attrObservers.clear();
}
