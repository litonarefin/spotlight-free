import React, { useEffect } from "react";
import { useStore } from "../../store/useStore";
import SearchList from "../SearchList";
import { data } from "../../store/useDataStore";
import toast from "react-hot-toast";
import apiFetch from "@wordpress/api-fetch";
import { addQueryArgs } from "@wordpress/url";
import { updateOptions } from "../../data/update";

const Update = () => {
  const [fields, setStore] = useStore((store) => store);
  const { selectedCategory, backspace } = fields;

  const updatePluginAction = (res) => {
    if (res?.id === "update_all") {
      (res?.plugins || [])?.forEach(async (plRes) => {
        await updatePlugin(plRes);
      });
    } else {
      updatePlugin(res);
    }
  };

  const getUpdatePlugins = async () => {
    setStore({ isLoading: true });
    let startTime = new Date().getTime(),
      endTime;
    apiFetch({ path: `plugins-with-updates` }).then((pluginsData) => {
      endTime = new Date().getTime();

      const updateNeedPlugins = [];
      (pluginsData?.plugins || []).forEach((plugin) => {
        updateNeedPlugins.push({
          id: plugin.slug,
          title: plugin.title,
          slug: plugin.slug,
          url: "",
          icon: "",
          callback: true,
        });
      });

      const updateAll = {
        id: "update_all",
        title: "Update All Plugins",
        slug: "",
        url: "",
        icon: "refresh",
        callback: true,
        isPremium: !WPSPOTLIGHT_CORE.is_premium,
        plugins: updateNeedPlugins,
      };

      setStore({
        isLoading: false,
        defaultData: updateNeedPlugins.length ? [updateAll, ...updateNeedPlugins] : [],
        result: [],
        resTime: endTime - startTime,
        resultCount: updateNeedPlugins.length,
        errorMessage: !updateNeedPlugins.length ? "Plugins update not available!" : "",
        callback: updatePluginAction,
      });
    });
  };

  const updatePlugin = async (res) => {
    const queryParams = { plugin_slug: res.slug };

    const path = addQueryArgs("update-plugin", queryParams);

    const updateId = toast.loading(`Updating ${res.title}`);

    try {
      await apiFetch({ path, method: "POST" }).then((response) => {
        if (response.status === "success") {
          toast.remove(updateId);
          toast.success(response?.message);
          // popupClose(setStore);
        } else {
          toast.error(response?.message);
        }
      });
    } catch (err) {
      toast.remove(updateId);
      if (err.code === "rest_forbidden") {
        toast.error("Sorry! You do not have the sufficient permissions to update plugins.");
      } else {
        toast.error("Sorry! There is an error please contact to administrator.");
      }
    }
  };

  const updateThemeAction = (res) => {
    if (res?.id === "update_all") {
      (res?.themes || [])?.forEach(async (tmRes) => {
        await updateTheme(tmRes);
      });
    } else {
      updateTheme(res);
    }
  };

  const getUpdateThemes = async () => {
    setStore({ isLoading: true });
    let startTime = new Date().getTime(),
      endTime;
    apiFetch({ path: `themes-with-updates` }).then((themeData) => {
      endTime = new Date().getTime();

      const updateNeedThemes = [];
      (themeData?.themes || []).forEach((theme) => {
        updateNeedThemes.push({
          id: theme.slug,
          title: theme.theme_name,
          slug: theme.slug,
          url: "",
          icon: "",
          callback: true,
        });
      });

      const updateAll = {
        id: "update_all",
        title: "Update All Themes",
        slug: "",
        url: "",
        icon: "refresh",
        callback: true,
        isPremium: !WPSPOTLIGHT_CORE.is_premium,
        themes: updateNeedThemes,
      };

      setStore({
        isLoading: false,
        defaultData: updateNeedThemes.length ? [updateAll, ...updateNeedThemes] : [],
        result: [],
        resTime: endTime - startTime,
        resultCount: updateNeedThemes.length,
        errorMessage: !updateNeedThemes.length ? "Themes update not available!" : "",
        callback: updateThemeAction,
      });
    });
  };

  const updateTheme = async (res) => {
    const queryParams = { slug: res.slug };

    const path = addQueryArgs("update-theme", queryParams);

    const updateId = toast.loading(`Updating ${res.title}`);

    try {
      await apiFetch({ path, method: "POST" }).then((response) => {
        if (response.status === "success") {
          toast.remove(updateId);
          toast.success(response?.message);
          // popupClose(setStore);
        } else {
          toast.error(response?.message);
        }
      });
    } catch (err) {
      toast.remove(updateId);
      if (err.code === "rest_forbidden") {
        toast.error("Sorry! You do not have the sufficient permissions to update Themes.");
      } else {
        toast.error("Sorry! There is an error please contact to administrator.");
      }
    }
  };

  // Core Update
  const actionUpdate = () => {
    const updateCoreID = toast.loading(
      `Updating WordPress v${WPSPOTLIGHT_CORE.wp_version?.[0]?.current}`
    );

    apiFetch({ path: `wordpress-core`, method: "POST" })
      .then((response) => {
        toast.dismiss(updateCoreID);
        if (response.status === "success") {
          toast.success(response.message);
          window.location.reload();
        } else {
          toast.error(response.message);
        }
      })
      .catch((err) => {
        toast.dismiss(updateCoreID);
        if (err.code === "rest_forbidden") {
          toast.error(
            "Sorry! You do not have the sufficient permissions to update wordpress core."
          );
        } else {
          toast.error("Sorry! There is an error please contact to administrator.");
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
        errorMessage: "",
      });
    }

    if (selectedCategory?.[0]?.id === "update" && selectedCategory?.length === 1) {
      setStore({
        defaultData: updateOptions,
        result: [],
        // resTime: 0.3,
        // resultCount: 4,
        callback: actionUpdate,
      });
    } else if (selectedCategory?.[1]?.id === "plugins" && selectedCategory?.length === 2) {
      getUpdatePlugins();
    } else if (selectedCategory?.[1]?.id === "themes" && selectedCategory?.length === 2) {
      getUpdateThemes();
    } else if (selectedCategory?.length === 0) {
      setStore({ defaultData: data });
    }
  }, [selectedCategory, backspace]);

  return <SearchList />;
};

export default Update;
