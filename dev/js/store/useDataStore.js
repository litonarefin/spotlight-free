import { useCallback, useRef } from "react";
import {
  backendMenuData,
  darkModeOption,
  defaultMainOptions,
  frontendMenuData,
  multisiteOption,
} from "../data/data";
// import { getMacKeys } from "../utils/getMacKeys";
// import { isMac } from "../utils/device";

export const isTourComplete = WPSPOTLIGHT_CORE.tour_status;

// export const adminifyUiDarkModeOption = WPSPOTLIGHT_CORE.adminify_ui ? darkModeOption : [];

const multisiteObj = WPSPOTLIGHT_CORE.is_multisite ? multisiteOption : [];

// const macKeyOptions = getMacKeys(defaultMainOptions);

// export const data = isMac
//     ? [...macKeyOptions, ...adminifyUiDarkModeOption, ...wp_spotlight_menu?.menu_data]
//     : [...defaultMainOptions, ...adminifyUiDarkModeOption, ...wp_spotlight_menu?.menu_data];

let menuData = window.wp_spotlight_menu?.menu_data || [];

if (WPSPOTLIGHT_CORE.is_frontend) {
  const existingMenuData = localStorage.getItem("wpspotlight_menu_data");
  if (existingMenuData && existingMenuData !== "undefined") {
    menuData = JSON.parse(existingMenuData);
  }
} else {
  const existingMenuData = localStorage.getItem("wpspotlight_menu_data");
  if (
    existingMenuData !== "undefined" &&
    existingMenuData !== JSON.stringify(window.wp_spotlight_menu?.menu_data)
  ) {
    localStorage.setItem(
      "wpspotlight_menu_data",
      JSON.stringify(window.wp_spotlight_menu?.menu_data)
    );
  }
}

export const data = [
  ...(WPSPOTLIGHT_CORE.is_frontend ? Object.values(backendMenuData) : []),
  ...defaultMainOptions,
  ...multisiteObj,
  ...(WPSPOTLIGHT_CORE.is_frontend ? [] : Object.values(frontendMenuData)),
  // ...adminifyUiDarkModeOption,
  ...darkModeOption,
  ...menuData,
];

const useDataStore = () => {
  let defaultData = {
    selectedCategory: [],
    searchText: "",
    result: [],
    defaultData: data || [],
    resTime: 0,
    resultCount: 0,
    backspace: false,
    callback: null,
    openPopup: isTourComplete ? false : true,
    openSettings: false,
    databaseKey: {},
    openList: isTourComplete ? false : true,
    delaySearch: false,
    errorMessage: "",
    isLoading: false,
  };

  const store = useRef(defaultData);
  const get = useCallback(() => store.current, []);

  const subscribers = useRef(new Set());
  const set = useCallback((value) => {
    store.current = { ...store.current, ...value };
    return subscribers.current.forEach((callback) => callback());
  }, []);

  const subscribe = useCallback((callback) => {
    subscribers.current.add(callback);
    return () => subscribers.current.delete(callback);
  }, []);

  return { get, set, subscribe };
};

export default useDataStore;
