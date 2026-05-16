import React, { useEffect } from "react";
import SearchList from "../SearchList";
import { useStore } from "../../store/useStore";
import { data } from "../../store/useDataStore";
// import { popupClose } from "../../utils/popupClose";
import { addQueryArgs } from "@wordpress/url";
import apiFetch from "@wordpress/api-fetch";

const DarkLightMode = () => {
  const [fields, setStore] = useStore((store) => store);
  const { selectedCategory, backspace } = fields;

  const getMode = (res) => {
    const queryParams = { mode: res.id };

    const path = addQueryArgs("light-dark-mode", queryParams);

    apiFetch({ path }).then((response) => {
      // popupClose(setStore, 100);

      if (response.status === "success") {
        const parentDOM = parent.window;

        if (res.id === "dark") {
          if (WPSPOTLIGHT_CORE.adminify_ui) {
            window.AdminifyDarkMode.enable({ brightness: 120 });
            parentDOM.AdminifyDarkMode.enable({ brightness: 120 });
          } else {
            window.SpotlightDarkMode.enable({ brightness: 120 });
          }
        } else if (res.id === "light") {
          if (WPSPOTLIGHT_CORE.adminify_ui) {
            window.AdminifyDarkMode.disable();
            parentDOM.AdminifyDarkMode.disable();
          } else {
            window.SpotlightDarkMode.disable();
          }
        } else if (res.id === "system") {
          if (WPSPOTLIGHT_CORE.adminify_ui) {
            const isDark = parentDOM.matchMedia("(prefers-color-scheme: dark)").matches;

            if (isDark) {
              window.AdminifyDarkMode.enable({ brightness: 120 });
              parentDOM.AdminifyDarkMode.enable({ brightness: 120 });
            } else {
              window.AdminifyDarkMode.disable();
              parentDOM.AdminifyDarkMode.disable();
            }
          } else {
            const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

            if (isDark) {
              window.SpotlightDarkMode.enable({ brightness: 120 });
            } else {
              window.SpotlightDarkMode.disable();
            }
          }
        }
      }
    });
  };

  useEffect(() => {
    if (selectedCategory?.length > 0 && backspace) {
      selectedCategory.pop();
      setStore({
        selectedCategory: selectedCategory,
        backspace: false,
        resTime: 0,
        resultCount: 0,
      });
    }

    if (selectedCategory?.[0]?.id === "dark_light_mode" && selectedCategory?.length === 1) {
      setStore({
        defaultData: [
          {
            id: "dark",
            title: "Dark Mode",
            url: "",
            icon: "moon",
            callback: true,
            tags: WPSPOTLIGHT_CORE.mode === "dark" ? [{ name: "Active", bg: true }] : [],
          },
          {
            id: "light",
            title: "Light Mode",
            url: "",
            icon: "sun",
            callback: true,
            tags:
              WPSPOTLIGHT_CORE.mode === "light" || !WPSPOTLIGHT_CORE.mode
                ? [{ name: "Active", bg: true }]
                : [],
          },
          {
            id: "system",
            title: "System",
            url: "",
            icon: "laptop",
            callback: true,
            tags: WPSPOTLIGHT_CORE.mode === "system" ? [{ name: "Active", bg: true }] : [],
          },
        ],
        result: [],
        // resTime: 0.3,
        // resultCount: 4,
        callback: getMode,
      });
    } else if (selectedCategory?.length === 0) {
      setStore({ defaultData: data });
    }
  }, [selectedCategory, backspace]);

  return <SearchList />;
};

export default DarkLightMode;
