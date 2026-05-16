import React, { useEffect } from "react";
import SearchList from "../SearchList";
import { useStore } from "../../store/useStore";
import apiFetch from "@wordpress/api-fetch";
import { data } from "../../store/useDataStore";

const Create = () => {
  const [fields, setStore] = useStore((store) => store);
  const { selectedCategory, backspace } = fields;

  function getAllPostTypes() {
    setStore({ isLoading: true });
    let startTime = new Date().getTime(),
      endTime;
    apiFetch({ path: `registered-post-types` }).then((postTypesData) => {
      endTime = new Date().getTime();

      const postTypes = [];
      (postTypesData?.post_types || []).forEach((postType) => {
        postTypes.push({
          title: postType.name,
          slug: postType.slug,
          url: `${WPSPOTLIGHT_CORE.admin_url}post-new.php?post_type=${postType.slug}`,
          icon: "",
          direction: "link",
        });
      });

      setStore({
        isLoading: false,
        defaultData: postTypes,
        result: [],
        resTime: endTime - startTime,
        resultCount: postTypes.length,
      });
    });
  }

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

    if (selectedCategory?.[0]?.id === "create" && selectedCategory?.length === 1) {
      getAllPostTypes();
    } else if (selectedCategory?.length === 0) {
      setStore({ defaultData: data });
    }
  }, [selectedCategory, backspace]);

  return <SearchList />;
};

export default Create;
