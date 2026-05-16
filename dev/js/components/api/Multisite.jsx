import React, { useEffect } from "react";
import { useStore } from "../../store/useStore";
import { data } from "../../store/useDataStore";
import SearchList from "../SearchList";
import apiFetch from "@wordpress/api-fetch";
import { networkAdminMenuData } from "../../data/data";

const Multisite = () => {
  const [fields, setStore] = useStore((store) => store);
  const { selectedCategory, backspace } = fields;

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

    if (selectedCategory?.[0]?.id === "multisite" && selectedCategory?.length === 1) {
      let startTime = new Date().getTime(),
        endTime;
      apiFetch({ path: `network-sites` }).then((siteData) => {
        endTime = new Date().getTime();

        const sites = [];
        siteData?.sites?.forEach((site) => {
          sites.push({
            title: site.site_title,
            url: site.admin_url,
            icon: "",
            direction: "link",
          });
        });

        setStore({
          defaultData: [
            ...(WPSPOTLIGHT_CORE.network_admin_url ? Object.values(networkAdminMenuData) : []),
            ...sites,
          ],
          result: [],
          resTime: endTime - startTime,
          resultCount: sites.length,
        });
      });
    } else if (selectedCategory?.length === 0) {
      setStore({ defaultData: data });
    }
  }, [selectedCategory, backspace]);

  return <SearchList />;
};

export default Multisite;
