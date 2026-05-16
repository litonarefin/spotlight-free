import React, { useEffect, useRef } from "react";
import FuseSearch from "./FuseSearch";
import { useStore } from "../store/useStore";
import { useHotkeys } from "react-hotkeys-hook";
import {
  mainOptions,
  defaultSettingsOptions,
  frontendMenuData,
  backendMenuData,
} from "../data/data";
import useKeyData from "../hooks/useKeyData";
import { data, isTourComplete } from "../store/useDataStore";

const Form = () => {
  const [openPopup, setStore] = useStore((store) => store.openPopup);
  const [databaseKey, _] = useStore((store) => store.databaseKey);
  const [tourCompleted, __] = useStore((store) => store.tourCompleted);

  const _databaseKey = useKeyData(setStore);

  const ref = useRef(null);

  if (databaseKey?.open_spotlight) {
    useHotkeys(databaseKey?.open_spotlight, () =>
      setStore({
        openPopup: true,
        selectedCategory: [],
        searchText: "",
        result: [],
        // defaultData: [...data, ...wp_spotlight_menu?.menu_data] || [],
        defaultData: [...data] || [],
      })
    );
  } else if (defaultSettingsOptions.open_spotlight.shortcutKey) {
    useHotkeys(defaultSettingsOptions.open_spotlight.shortcutKey, () =>
      setStore({
        openPopup: true,
        selectedCategory: [],
        searchText: "",
        result: [],
        // defaultData: [...data, ...wp_spotlight_menu?.menu_data] || [],
        defaultData: [...data] || [],
      })
    );
  }

  if (databaseKey?.close_spotlight) {
    useHotkeys(databaseKey?.close_spotlight, () => setStore({ openPopup: false, openList: false }));
  } else if (defaultSettingsOptions.close_spotlight.shortcutKey) {
    useHotkeys(defaultSettingsOptions.close_spotlight.shortcutKey, () =>
      setStore({ openPopup: false, openList: false })
    );
  }

  if (databaseKey?.logout) {
    useHotkeys(databaseKey?.logout, () => {
      window.open(WPSPOTLIGHT_CORE.logout_url, "_self");
    });
  } else if (mainOptions.logout.shortcutKey) {
    useHotkeys(mainOptions.logout.shortcutKey, () => {
      window.open(WPSPOTLIGHT_CORE.logout_url, "_self");
    });
  }

  if (databaseKey?.users) {
    useHotkeys(databaseKey?.users, () =>
      setStore({
        openPopup: true,
        openList: true,
        selectedCategory: [mainOptions.users],
      })
    );
  } else if (mainOptions.users.shortcutKey) {
    useHotkeys(mainOptions.users.shortcutKey, () =>
      setStore({
        openPopup: true,
        openList: true,
        selectedCategory: [mainOptions.users],
      })
    );
  }

  if (databaseKey?.plugins) {
    useHotkeys(databaseKey?.plugins, () =>
      setStore({
        openPopup: true,
        openList: true,
        selectedCategory: [mainOptions.plugins],
      })
    );
  } else if (mainOptions.plugins.shortcutKey) {
    useHotkeys(mainOptions.plugins.shortcutKey, () =>
      setStore({
        openPopup: true,
        openList: true,
        selectedCategory: [mainOptions.plugins],
      })
    );
  }

  if (databaseKey?.themes) {
    useHotkeys(databaseKey?.themes, () =>
      setStore({
        openPopup: true,
        openList: true,
        selectedCategory: [mainOptions.themes],
      })
    );
  } else if (mainOptions.themes.shortcutKey) {
    useHotkeys(mainOptions.themes.shortcutKey, () =>
      setStore({
        openPopup: true,
        openList: true,
        selectedCategory: [mainOptions.themes],
      })
    );
  }

  if (databaseKey?.post_types) {
    useHotkeys(databaseKey?.post_types, () =>
      setStore({
        openPopup: true,
        openList: true,
        selectedCategory: [mainOptions.post_types],
      })
    );
  } else if (mainOptions.post_types.shortcutKey) {
    useHotkeys(mainOptions.post_types.shortcutKey, () =>
      setStore({
        openPopup: true,
        openList: true,
        selectedCategory: [mainOptions.post_types],
      })
    );
  }

  if (databaseKey?.create) {
    useHotkeys(databaseKey?.create, () =>
      setStore({
        openPopup: true,
        openList: true,
        selectedCategory: [mainOptions.create],
      })
    );
  } else if (mainOptions.create.shortcutKey) {
    useHotkeys(mainOptions.create.shortcutKey, () =>
      setStore({
        openPopup: true,
        openList: true,
        selectedCategory: [mainOptions.create],
      })
    );
  }

  if (databaseKey?.media) {
    useHotkeys(databaseKey?.media, () =>
      setStore({
        openPopup: true,
        openList: true,
        selectedCategory: [mainOptions.media],
      })
    );
  } else if (mainOptions.media.shortcutKey) {
    useHotkeys(mainOptions.media.shortcutKey, () =>
      setStore({
        openPopup: true,
        openList: true,
        selectedCategory: [mainOptions.media],
      })
    );
  }

  if (databaseKey?.update) {
    useHotkeys(databaseKey?.update, () =>
      setStore({
        openPopup: true,
        openList: true,
        selectedCategory: [mainOptions.update],
      })
    );
  } else if (mainOptions.update.shortcutKey) {
    useHotkeys(mainOptions.update.shortcutKey, () =>
      setStore({
        openPopup: true,
        openList: true,
        selectedCategory: [mainOptions.update],
      })
    );
  }

  if (databaseKey?.key_binding) {
    useHotkeys(databaseKey?.key_binding, () => setStore({ openSettings: true }));
  } else if (mainOptions.key_binding.shortcutKey) {
    useHotkeys(mainOptions.key_binding.shortcutKey, () => setStore({ openSettings: true }));
  }

  // For Backend
  if (databaseKey?.wp_admin) {
    useHotkeys(databaseKey?.wp_admin, () => {
      window.open(
        backendMenuData.wp_admin.url,
        backendMenuData.wp_admin.newWindow ? "_blank" : "_self"
      );
    });
  } else if (backendMenuData.wp_admin.shortcutKey) {
    useHotkeys(backendMenuData.wp_admin.shortcutKey, () => {
      window.open(
        backendMenuData.wp_admin.url,
        backendMenuData.wp_admin.newWindow ? "_blank" : "_self"
      );
    });
  }

  // For Frontend
  if (databaseKey?.view_website) {
    useHotkeys(databaseKey?.view_website, () => {
      window.open(
        frontendMenuData.view_website.url,
        frontendMenuData.view_website.newWindow ? "_blank" : "_self"
      );
    });
  } else if (frontendMenuData.view_website.shortcutKey) {
    useHotkeys(frontendMenuData.view_website.shortcutKey, () => {
      window.open(
        frontendMenuData.view_website.url,
        frontendMenuData.view_website.newWindow ? "_blank" : "_self"
      );
    });
  }

  const handleClickOutside = (event) => {
    if (ref.current && !ref.current.contains(event.target)) {
      if (isTourComplete || localStorage.getItem("tourCompleted")) {
        setStore({ openPopup: false, openList: false });
      }
    }
  };

  useEffect(() => {
    /**
     * Handle Admin Bar Floating Icon Click to Open Spotlight
     */
    const spotlightIcon = document.querySelector(".jltwp_spotlight_floating_icon");
    spotlightIcon.addEventListener("click", () => setStore({ openPopup: true, openList: false }));

    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  return (
    <>
      {openPopup ? (
        <div className="jltwp-spotlight-search-form-wrapper">
          <div className="jltwp-spotlight-search-form-overlay">
            <div ref={ref}>
              <FuseSearch />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Form;
