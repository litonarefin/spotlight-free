import React, { useEffect, useState } from "react";
import SearchList from "../SearchList";
import { useStore } from "../../store/useStore";
import { pluginOptions } from "../../data/plugins";
import apiFetch from "@wordpress/api-fetch";
import { addQueryArgs } from "@wordpress/url";
import { data } from "../../store/useDataStore";
import toast from "react-hot-toast";
import { popupClose } from "../../utils/popupClose";
import PluginUpload from "../PluginUpload";

const Plugins = () => {
  const [fields, setStore] = useStore((store) => store);
  const { searchText, selectedCategory, backspace } = fields;
  const [firstFetchPlugins, setFirstFetchPlugins] = useState([]);
  const [resCompleted, setResCompleted] = useState(false);

  const activePlugin = (res) => {
    const queryParams = { action: "activate", slug: res.slug };

    const path = addQueryArgs("plugin-manager", queryParams);

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

  const deactivatePlugin = (res) => {
    const queryParams = { action: "deactivate", slug: res.slug };

    const path = addQueryArgs("plugin-manager", queryParams);

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

  const deletedPlugin = (res) => {
    const queryParams = { action: "delete", slug: res.slug };

    const path = addQueryArgs("plugin-manager", queryParams);

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

  const orgPluginAction = (res) => {
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
          url: `https://wordpress.org/plugins/${res?.slug}`,
          newWindow: true,
          slug: "",
          icon: "wordpress",
          direction: "link",
        },
        {
          id: "download",
          title: `Download > ${res.title}`,
          url: `https://downloads.wordpress.org/plugin/${res?.slug}.zip`,
          // newWindow: true,
          slug: "",
          icon: "download",
          direction: "link",
        },
      ],
      result: [],
      resTime: 0,
      resultCount: 0,
      callback: installAndActivePlugin,
    });
  };

  const installPlugin = async (res) => {
    const downloadToastId = toast.loading("Downloading...");
    try {
      const response = await apiFetch({
        path: `plugin-manager?action=download&slug=${res.slug}`,
        method: "POST",
      });

      if (response.status === "success") {
        toast.dismiss(downloadToastId);
        const unpackToastId = toast.loading("Unpacking...");
        const unpackResponse = await apiFetch({
          path: `plugin-manager?action=unpack&slug=${res.slug}`,
          method: "POST",
        });
        if (unpackResponse.status === "success") {
          toast.dismiss(unpackToastId);
          const installToastId = toast.loading("Installing...");
          const installResponse = await apiFetch({
            path: `plugin-manager?action=install&slug=${res.slug}`,
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
      toast.dismiss(downloadToastId);
      if (err.code === "rest_forbidden") {
        toast.error(
          "Sorry! You do not have the sufficient permissions to install or update plugins."
        );
      } else {
        toast.error("Sorry! There is an error please contact to administrator.");
      }
    }
  };

  const installAndActivePlugin = async (res) => {
    if (res?.action === "install") {
      await installPlugin(res);
    } else if (res?.action === "install_and_active") {
      await installPlugin(res);
      activePlugin(res);
    }
  };

  const getAllPlugins = async () => {
    setStore({
      isLoading: true,
    });
    //
    let startTime = new Date().getTime(),
      endTime;
    apiFetch({ path: `get-all-plugins` }).then((pluginsData) => {
      endTime = new Date().getTime();

      const allInstalledPlugin = [];
      pluginsData.forEach((plugin) => {
        allInstalledPlugin.push({
          id: plugin.slug,
          title: plugin.name,
          slug: plugin.slug,
          url: "",
          icon: "",
          callback: true,
        });
      });

      setStore({
        isLoading: false,
        defaultData: allInstalledPlugin,
        result: [],
        resTime: endTime - startTime,
        resultCount: allInstalledPlugin.length,
        callback: downloadPlugin,
      });
    });
  };

  const getDeactivatePlugins = async (action = "active") => {
    setStore({
      isLoading: true,
    });
    let startTime = new Date().getTime(),
      endTime;
    apiFetch({ path: `deactivated-plugins` }).then((pluginsData) => {
      endTime = new Date().getTime();

      const deactivatedPlugins = [];
      pluginsData.forEach((plugin) => {
        deactivatedPlugins.push({
          id: plugin.slug,
          action: action,
          title: plugin.name,
          slug: plugin.slug,
          url: "",
          icon: "",
          callback: true,
          status: false,
        });
      });

      setStore({
        isLoading: false,
        defaultData: deactivatedPlugins,
        result: [],
        resTime: endTime - startTime,
        resultCount: deactivatedPlugins.length,
        callback: pluginActions,
      });
    });
  };

  const pluginActions = (res) => {
    if (res.action === "delete") {
      deletedPlugin(res);
    } else if (res.action === "active") {
      activePlugin(res);
    }
  };

  const getActivatePlugins = async () => {
    setStore({
      isLoading: true,
    });
    let startTime = new Date().getTime(),
      endTime;
    apiFetch({ path: `activated-plugins` }).then((pluginsData) => {
      endTime = new Date().getTime();

      const activatePlugins = [];
      pluginsData.forEach((plugin) => {
        activatePlugins.push({
          id: plugin.slug,
          title: plugin.name,
          slug: plugin.slug,
          url: "",
          icon: "",
          callback: true,
          status: true,
        });
      });

      setStore({
        isLoading: false,
        defaultData: activatePlugins,
        result: [],
        resTime: endTime - startTime,
        resultCount: activatePlugins.length,
        callback: deactivatePlugin,
      });
    });
  };

  const downloadPlugin = async (res) => {
    const queryParams = { slug: res.slug };
    const path = addQueryArgs("download-plugin", queryParams);

    apiFetch({ path }).then((response) => {
      if (response?.status === "success") {
        window.open(response.download_url);
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

    if (selectedCategory?.[0]?.id === "plugins" && selectedCategory?.length === 1) {
      setStore({
        defaultData: pluginOptions,
        result: [],
        // resTime: 0.3,
        // resultCount: 4,
      });
    } else if (selectedCategory?.[1]?.id === "activate" && selectedCategory?.length === 2) {
      getDeactivatePlugins("active");
    } else if (selectedCategory?.[1]?.id === "deactivate" && selectedCategory?.length === 2) {
      getActivatePlugins();
    } else if (selectedCategory?.[1]?.id === "delete" && selectedCategory?.length === 2) {
      getDeactivatePlugins("delete");
    } else if (selectedCategory?.[1]?.id === "download" && selectedCategory?.length === 2) {
      getAllPlugins();
    } else if (selectedCategory?.[1]?.id === "pl_upload" && selectedCategory?.length === 2) {
      setStore({
        defaultData: [
          {
            id: "upload_plugin_drop",
            title: "",
            url: "",
            component: <PluginUpload />,
          },
        ],
        result: [],
        resTime: 0,
        resultCount: 0,
      });
    } else if (
      selectedCategory?.[1]?.id === "wordpress_repository" &&
      selectedCategory?.length === 2 &&
      !searchText
    ) {
      setStore({ delaySearch: true, isLoading: true });
      let startTime = new Date().getTime(),
        endTime;
      fetch(
        `https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&request[per_page]=10&request[fields][ratings]=0&request[fields][homepage]=0&request[fields][rating]=0&request[fields][tested]=0&request[fields][description]=0&request[fields][tags]=0&request[fields][donate_link]=0&request[fields][short_description]=0&request[fields][added]=0&request[fields][active_installs]=0&request[fields][downloaded]=0&request[fields][last_updated]=0&request[fields][requires_php]=0&request[fields][requires]=0`
      )
        .then((res) => res.json())
        .then((data) => {
          if (
            selectedCategory?.[1]?.id !== "wordpress_repository" &&
            selectedCategory?.length !== 2
          )
            return;
          endTime = new Date().getTime();

          const searchPlugins = [];
          (data?.plugins || [])?.forEach((plugin) => {
            searchPlugins.push({
              id: plugin.slug,
              title: plugin.name,
              slug: plugin.slug,
              url: "",
              icon: "",
              direction: "cornerRightUp",
              img: plugin.icons?.["1x"],
              dependency: true,
              callback: true,
            });
          });

          setFirstFetchPlugins(searchPlugins);

          setStore({
            isLoading: false,
            defaultData: searchPlugins,
            result: [],
            resTime: endTime - startTime,
            resultCount: searchPlugins.length,
            callback: orgPluginAction,
          });
        });
    } else if (selectedCategory?.length === 0) {
      setStore({ defaultData: data });
    }
  }, [selectedCategory, backspace]);

  useEffect(() => {
    let resCompleteInterval;
    if (
      selectedCategory?.[1]?.id === "wordpress_repository" &&
      selectedCategory?.length === 2 &&
      searchText
    ) {
      setStore({ delaySearch: true, isLoading: true });
      let startTime = new Date().getTime(),
        endTime;
      fetch(
        `https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&request[per_page]=5&request[fields][ratings]=0&request[fields][homepage]=0&request[fields][rating]=0&request[fields][tested]=0&request[fields][description]=0&request[fields][tags]=0&request[fields][donate_link]=0&request[fields][short_description]=0&request[fields][added]=0&request[fields][active_installs]=0&request[fields][downloaded]=0&request[fields][last_updated]=0&request[fields][requires_php]=0&request[fields][requires]=0&request[search]=${searchText}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (
            selectedCategory?.[1]?.id !== "wordpress_repository" &&
            selectedCategory?.length !== 2
          )
            return;

          endTime = new Date().getTime();

          const searchPlugins = [];
          (data?.plugins || [])?.forEach((plugin) => {
            searchPlugins.push({
              id: plugin.slug,
              title: plugin.name,
              slug: plugin.slug,
              url: "",
              direction: "cornerRightUp",
              // icon: plugin.icons?.["1x"],
              img: plugin.icons?.["1x"],
              dependency: true,
              callback: true,
            });
          });

          setStore({
            isLoading: false,
            defaultData: searchPlugins,
            result: [],
            resTime: endTime - startTime,
            resultCount: searchPlugins.length,
            callback: orgPluginAction,
          });
          setResCompleted(true);
        });
    } else if (
      selectedCategory?.[1]?.id === "wordpress_repository" &&
      selectedCategory?.length === 2 &&
      !searchText
    ) {
      resCompleteInterval = setInterval(() => {
        if (resCompleted) {
          setStore({
            defaultData: firstFetchPlugins,
            result: [],
            resTime: 0,
            resultCount: 0,
            callback: orgPluginAction,
          });
          setResCompleted(false);
          clearInterval(resCompleteInterval);
        }
      }, 1000);
    } else if (
      selectedCategory?.[0]?.id === "plugins" &&
      selectedCategory?.length === 1 &&
      !searchText
    ) {
      setStore({
        defaultData: pluginOptions,
        result: [],
        // resTime: 0.3,
        // resultCount: 4,
        delaySearch: false,
      });
    }

    return () => clearInterval(resCompleteInterval);
  }, [searchText]);

  return <SearchList />;
};

export default Plugins;
