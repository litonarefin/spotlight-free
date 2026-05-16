import React, { useEffect, useState } from "react";
import SearchList from "../SearchList";
import { useStore } from "../../store/useStore";
import { data, isTourComplete } from "../../store/useDataStore";
import apiFetch from "@wordpress/api-fetch";
import { addQueryArgs } from "@wordpress/url";
import toast from "react-hot-toast";
import snakeCase from "lodash/snakeCase";

const PostTypes = () => {
  const [fields, setStore] = useStore((store) => store);
  const { searchText, selectedCategory, backspace } = fields;

  const [postType, setPostType] = useState([]);
  const [firstFetchPostsTypes, setFirstFetchPostsTypes] = useState({});
  const [firstFetchPosts, setFirstFetchPosts] = useState({});

  function getAllPostTypes() {
    setStore({ isLoading: true });
    let startTime = new Date().getTime(),
      endTime;
    apiFetch({ path: `registered-post-types` }).then((postTypesData) => {
      if (selectedCategory?.[0]?.id !== "post_types" && selectedCategory?.length !== 1) return;

      endTime = new Date().getTime();

      setPostType(postTypesData?.post_types || []);

      const postTypes = [];
      (postTypesData?.post_types || []).forEach((postType) => {
        postTypes.push({
          title: postType.name,
          slug: postType.slug,
          url: "",
          icon: "",
          dependency: true,
          direction: "cornerRightUp",
          callback: true,
        });
      });

      setStore({
        isLoading: false,
        defaultData: postTypes,
        result: [],
        resTime: endTime - startTime,
        resultCount: postTypes.length,
        callback: getAllPostByType,
      });

      setFirstFetchPostsTypes({
        postTypes: postTypes,
        resTime: endTime - startTime,
        resultCount: postTypes.length,
      });
    });
  }

  async function actionPostType(res) {
    const defaultData = [
      {
        id: "edit",
        title: "Edit",
        url: res.url,
        slug: res.slug,
        icon: "editFile",
        direction: "link",
      },
      {
        id: "view",
        title: "View",
        url: res.previewUrl,
        icon: "view",
        newWindow: true,
        direction: "link",
      },
      {
        id: res.id,
        title: "Trash",
        url: "",
        slug: res.slug,
        icon: "trash",
        callback: true,
        isPremium: !WPSPOTLIGHT_CORE.is_premium,
      },
      {
        id: res.id,
        title: "Delete",
        url: "",
        slug: res.slug,
        icon: "trash",
        callback: true,
        isPremium: !WPSPOTLIGHT_CORE.is_premium,
      },
    ];

    if (WPSPOTLIGHT_CORE.is_premium) {
      setStore({ isLoading: true });
      const queryParams = { post_id: res.id };
      const path = addQueryArgs("post-actions", queryParams);

      apiFetch({ path }).then((response) => {
        if (response.status === "success") {
          const actions = response.actions;

          const existingActions = [];

          for (let key in actions) {
            existingActions.push({
              id: snakeCase(actions[key].title),
              title: actions[key].title,
              url: actions[key].url,
              slug: "",
              icon: "editFile",
              direction: "link",
              isPremium: !WPSPOTLIGHT_CORE.is_premium,
            });

            // code block to be executed
          }

          setStore({
            isLoading: false,
            defaultData: [...existingActions, ...defaultData],
            result: [],
            resTime: 0,
            resultCount: 0,
            callback: actionPost,
          });
        } else {
          setStore({
            isLoading: false,
            defaultData: [...defaultData],
            result: [],
            resTime: 0,
            resultCount: 0,
            callback: actionPost,
          });
        }
      });
    } else {
      setStore({
        defaultData: [...defaultData],
        result: [],
        resTime: 0,
        resultCount: 0,
        callback: actionPost,
      });
    }
  }

  function getAllPostByType(res) {
    setStore({ isLoading: true });
    const queryParams = { post_type: res.slug };
    const path = addQueryArgs("posts-by-type", queryParams);

    let startTime = new Date().getTime(),
      endTime;
    apiFetch({ path, method: "GET" }).then((postTyeData) => {
      endTime = new Date().getTime();

      const allPosts = [];
      postTyeData.posts.forEach((post) => {
        allPosts.push({
          id: post.id,
          title: post.title,
          url: post.edit_url,
          previewUrl: post.link,
          dependency: true,
          callback: true,
          direction: "cornerRightUp",
        });
      });

      setStore({
        isLoading: false,
        defaultData: allPosts,
        result: [],
        resTime: endTime - startTime,
        resultCount: allPosts.length,
        callback: actionPostType,
      });

      setFirstFetchPosts({
        allPosts: allPosts,
        resTime: endTime - startTime,
        resultCount: allPosts.length,
      });
    });
  }

  function actionPost(res) {
    if (res.title === "Trash") {
      trashPostById(res);
    } else if (res.title === "Delete") {
      deletePostById(res);
    }
  }

  function trashPostById(res) {
    const queryParams = { id: res.id };
    const path = addQueryArgs("trash-post", queryParams);

    apiFetch({ path: path, method: "POST" }).then((response) => {
      if (response.status === "success") {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    });
  }

  function deletePostById(res) {
    const queryParams = { id: res.id };
    const path = addQueryArgs("delete-post-by-id", queryParams);

    apiFetch({ path: path, method: "DELETE" }).then((response) => {
      if (response.status === "success") {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    });
  }

  function getSearchPostByType(searchStr, type) {
    const queryParams = { post_type: type, search_text: searchStr };
    const path = addQueryArgs("search-by-post-types", queryParams);

    let startTime = new Date().getTime(),
      endTime;
    apiFetch({ path, method: "GET" }).then((postTyeData) => {
      if (
        selectedCategory?.[0]?.id !== "post_types" &&
        selectedCategory?.length !== 2 &&
        !searchText
      )
        return;

      endTime = new Date().getTime();

      const allPosts = [];
      postTyeData.posts.forEach((post) => {
        allPosts.push({
          id: post.id,
          title: post.title,
          url: post.edit_url,
          previewUrl: post.link,
          dependency: true,
          callback: true,
          direction: "cornerRightUp",
        });
      });

      setStore({
        defaultData: allPosts,
        result: [],
        resTime: endTime - startTime,
        resultCount: allPosts.length,
        callback: actionPostType,
      });
    });
  }

  useEffect(() => {
    if (selectedCategory?.length > 0 && backspace && isTourComplete) {
      selectedCategory.pop();
      setStore({
        selectedCategory: selectedCategory,
        backspace: false,
        resTime: 0,
        resultCount: 0,
      });
    }

    if (selectedCategory?.[0]?.id === "post_types" && selectedCategory?.length === 1) {
      setStore({ delaySearch: false });
      // Already Fetch All Post types
      if (firstFetchPostsTypes?.postTypes?.length) {
        setStore({
          defaultData: firstFetchPostsTypes?.postTypes || 0,
          result: [],
          resTime: firstFetchPostsTypes?.resTime || 0,
          resultCount: firstFetchPostsTypes?.resultCount || 0,
          callback: getAllPostByType,
        });
      } else {
        getAllPostTypes();
      }
    } else if (
      selectedCategory?.[0]?.id === "post_types" &&
      selectedCategory?.length === 2 &&
      !searchText
    ) {
      const pType = postType.find((type) => type.name === selectedCategory[1]?.title);
      getAllPostByType({ slug: isTourComplete ? pType.slug : "post" });
    } else if (selectedCategory?.length === 0) {
      setStore({ defaultData: data });
    }
  }, [selectedCategory, backspace]);

  useEffect(() => {
    if (
      selectedCategory?.[0]?.id === "post_types" &&
      selectedCategory?.length === 2 &&
      searchText
    ) {
      setStore({ delaySearch: true });
      const pType = postType.find((type) => type.name === selectedCategory[1]?.title);
      getSearchPostByType(searchText, isTourComplete ? pType.slug : "post");
    } else if (
      selectedCategory?.[0]?.id === "post_types" &&
      selectedCategory?.length === 2 &&
      !searchText
    ) {
      // Set First Fetch Data
      setStore({
        defaultData: firstFetchPosts?.allPosts || [],
        result: [],
        resTime: firstFetchPosts?.resTime || 0,
        resultCount: firstFetchPosts?.resultCount || 0,
        callback: actionPostType,
      });
    }
  }, [searchText]);

  return <SearchList />;
};

export default PostTypes;
