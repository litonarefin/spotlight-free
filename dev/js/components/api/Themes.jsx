import React, { useEffect } from "react";
import { useStore } from "../../store/useStore";
import SearchList from "../SearchList";
import { themeOptions } from "../../data/themes";
import { data } from "../../store/useDataStore";
import toast from "react-hot-toast";
import apiFetch from "@wordpress/api-fetch";
import { addQueryArgs } from "@wordpress/url";
import { popupClose } from "../../utils/popupClose";
import ThemeUpload from "../ThemeUpload";

const Themes = () => {
  const [fields, setStore] = useStore((store) => store);
  const { searchText, selectedCategory, backspace } = fields;

  const getInstalledThemes = (callback, method = "") => {
    setStore({ isLoading: true });
    let startTime = new Date().getTime(),
      endTime;
    apiFetch({ path: `get_installed_themes` }).then((themesData) => {
      endTime = new Date().getTime();

      const installedThemes = [];
      (themesData?.themes || []).forEach((theme) => {
        if (method === "delete" && theme.is_active) return;

        const status = theme.is_active
          ? {
              status: true,
            }
          : {
              status: false,
            };
        installedThemes.push({
          title: theme.name,
          slug: theme.slug,
          url: "",
          icon: "",
          callback: true,
          ...status,
        });
      });

      setStore({
        isLoading: false,
        defaultData: installedThemes,
        result: [],
        resTime: endTime - startTime,
        resultCount: installedThemes.length,
        callback: callback,
      });
    });
  };

  const activeTheme = (res) => {
    const queryParams = { action: "activate", slug: res.slug };

    const path = addQueryArgs("theme-manager", queryParams);

    apiFetch({ path, method: "POST" }).then((response) => {
      if (response.status === "success") {
        toast.success(response?.message);
        popupClose(setStore);
        window.location.reload();
      } else {
        toast.error(response?.message);
      }
    });
  };

  const downloadTheme = (res) => {
    const queryParams = { slug: res.slug };
    const path = addQueryArgs("download-theme", queryParams);

    apiFetch({ path }).then((response) => {
      if (response?.status === "success") {
        window.open(response.download_url);
      }
    });
  };

  const deleteTheme = (res) => {
    const queryParams = { action: "delete", slug: res.slug };

    const path = addQueryArgs("theme-manager", queryParams);

    apiFetch({ path, method: "POST" }).then((response) => {
      if (response.status === "success") {
        toast.success(response?.message);
        popupClose(setStore);
        window.location.reload();
      } else {
        toast.error(response?.message);
      }
    });
  };

  const getThemes = (searchStr) => {
    setStore({ isLoading: true });

    const searchQuery = searchStr ? `&request[search]=${searchText}` : "";

    let startTime = new Date().getTime(),
      endTime;
    fetch(
      `https://api.wordpress.org/themes/info/1.2/?action=query_themes&request[per_page]=10&request[fields][ratings]=0&request[fields][homepage]=0&request[fields][rating]=0&request[fields][tested]=0&request[fields][description]=0&request[fields][tags]=0&request[fields][donate_link]=0&request[fields][short_description]=0&request[fields][added]=0&request[fields][active_installs]=0&request[fields][downloaded]=0&request[fields][last_updated]=0&request[fields][requires_php]=0&request[fields][requires]=0&request[fields][parent]=0&request[fields][template]=0${searchQuery}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (
          selectedCategory?.[1]?.id !== "wordpress_repository" &&
          selectedCategory?.length !== 2 &&
          !searchStr
        )
          return;

        if (
          selectedCategory?.[1]?.id !== "wordpress_repository" &&
          selectedCategory?.length !== 2 &&
          !!searchStr
        )
          return;

        endTime = new Date().getTime();

        const searchThemes = [];
        (data?.themes || [])?.forEach((theme) => {
          searchThemes.push({
            id: theme.slug,
            title: theme.name,
            slug: theme.slug,
            img: theme.screenshot_url,
            url: "",
            icon: "",
            dependency: true,
            direction: "cornerRightUp",
            callback: true,
          });
        });

        setStore({
          isLoading: false,
          defaultData: searchThemes,
          result: [],
          resTime: endTime - startTime,
          resultCount: searchThemes.length,
          callback: themeAction,
        });
      });
  };

  const themeAction = (res) => {
    setStore({
      defaultData: [
        {
          id: "install",
          action: "install",
          title: "Install",
          url: "",
          slug: res.slug,
          icon: "downloadCloud",
          callback: true,
        },
        {
          id: "install_and_active",
          action: "install_and_active",
          title: "Install & Active",
          url: "",
          slug: res.slug,
          icon: "cloudCog",
          callback: true,
          isPremium: !WPSPOTLIGHT_CORE.is_premium,
        },
        {
          id: "view_on_wordpress",
          title: "View on WordPress.org",
          url: `https://wordpress.org/themes/${res?.slug}`,
          newWindow: true,
          slug: "",
          icon: "wordpress",
          direction: "link",
        },
        {
          id: "download_theme",
          title: "Download Theme",
          url: `https://downloads.wordpress.org/theme/${res?.slug}.zip`,
          slug: "",
          icon: "download",
          direction: "link",
          isPremium: !WPSPOTLIGHT_CORE.is_premium,
        },
      ],
      result: [],
      resTime: 0,
      resultCount: 3,
      callback: installAndActiveTheme,
    });
  };

  const installTheme = async (res) => {
    const downloadToastId = toast.loading("Downloading...");
    try {
      const response = await apiFetch({
        path: `theme-manager?action=download&slug=${res.slug}`,
        method: "POST",
      });

      if (response.status === "success") {
        toast.dismiss(downloadToastId);
        const unpackToastId = toast.loading("Unpacking...");
        const unpackResponse = await apiFetch({
          path: `theme-manager?action=unpack&slug=${res.slug}`,
          method: "POST",
        });
        if (unpackResponse.status === "success") {
          toast.dismiss(unpackToastId);
          const installToastId = toast.loading("Installing...");
          const installResponse = await apiFetch({
            path: `theme-manager?action=install&slug=${res.slug}`,
            method: "POST",
          });
          if (installResponse.status === "success") {
            toast.dismiss(installToastId);
            toast.success(installResponse.message);
          } else {
            toast.error(installResponse.message);
          }
        }
      }
    } catch (err) {
      if (err.code === "rest_forbidden") {
        toast.dismiss(downloadToastId);
        toast.error(
          "Sorry! You do not have the sufficient permissions to install or update themes."
        );
      } else {
        toast.error("Sorry! There is an error please contact to administrator.");
      }
    }
  };

  const installAndActiveTheme = async (res) => {
    if (res?.action === "install") {
      await installTheme(res);
    } else if (res?.action === "install_and_active") {
      await installTheme(res);
      activeTheme(res);
    }
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

    if (selectedCategory?.[0]?.id === "themes" && selectedCategory?.length === 1) {
      setStore({
        defaultData: themeOptions,
        result: [],
        // resTime: 0.3,
        // resultCount: 4,
      });
    } else if (selectedCategory?.[1]?.id === "activate" && selectedCategory?.length === 2) {
      getInstalledThemes(activeTheme);
    } else if (selectedCategory?.[1]?.id === "delete" && selectedCategory?.length === 2) {
      getInstalledThemes(deleteTheme, "delete");
    } else if (selectedCategory?.[1]?.id === "download" && selectedCategory?.length === 2) {
      getInstalledThemes(downloadTheme);
    } else if (selectedCategory?.[1]?.id === "tm_upload" && selectedCategory?.length === 2) {
      setStore({
        defaultData: [
          {
            id: "upload_theme_drop",
            title: "",
            url: "",
            component: <ThemeUpload />,
          },
        ],
        result: [],
        resTime: 0,
        resultCount: 0,
      });
    } else if (
      selectedCategory?.[1]?.id === "wordpress_repository" &&
      selectedCategory?.length === 2
    ) {
      getThemes();
    } else if (selectedCategory?.length === 0) {
      setStore({ defaultData: data });
    }
  }, [selectedCategory, backspace]);

  useEffect(() => {
    if (
      selectedCategory?.[1]?.id === "wordpress_repository" &&
      selectedCategory?.length === 2 &&
      searchText
    ) {
      getThemes(searchText);
    } else if (
      selectedCategory?.[0]?.id === "themes" &&
      selectedCategory?.length === 1 &&
      !searchText
    ) {
      setStore({
        defaultData: themeOptions,
        result: [],
        // resTime: 0.3,
        // resultCount: 4,
      });
    }
  }, [searchText]);

  return <SearchList />;
};

export default Themes;
