import React, { useEffect } from "react";
import { useStore } from "../../store/useStore";
import { data } from "../../store/useDataStore";
import SearchList from "../SearchList";
import apiFetch from "@wordpress/api-fetch";
import { mediaOptions } from "../../data/media";
import { popupClose } from "../../utils/popupClose";
import { addQueryArgs } from "@wordpress/url";
import toast from "react-hot-toast";
import { downloadImage } from "../../utils/downloadImage";
import MediaUpload from "../MediaUpload";

const Media = () => {
  const [fields, setStore] = useStore((store) => store);
  const { searchText, selectedCategory, backspace } = fields;

  function getAllMedia(config = {}) {
    setStore({ isLoading: true });
    const queryParams = {};
    if (config?.searchText) {
      Object.assign(queryParams, { search: config?.searchText });
    }
    const path = addQueryArgs("media-search", queryParams);

    let startTime = new Date().getTime(),
      endTime;
    apiFetch({ path: path }).then((mediaData) => {
      endTime = new Date().getTime();

      const callback = config?.callback ? { callback: true } : {};
      const callbackAction = config?.callbackAction ? { callback: config?.callbackAction } : {};

      const allMedia = [];
      mediaData.forEach((media) => {
        allMedia.push({
          id: media.id,
          title: media.filename,
          url: media.edit_url,
          img: media.url,
          direction: "link",
          ...callback,
        });
      });

      setStore({
        isLoading: false,
        defaultData: allMedia,
        result: [],
        resTime: endTime - startTime,
        resultCount: allMedia.length,
        ...callbackAction,
      });
    });
  }

  function insertMedia(res) {
    if (WPSPOTLIGHT_CORE.page_editor === "gutenberg") {
      gutenbergEditor(res);
    } else if (WPSPOTLIGHT_CORE.page_editor === "elementor") {
      elementorEditor(res);
    } else if (WPSPOTLIGHT_CORE.page_editor === "bricks") {
      bricksEditor(res);
    } else if (WPSPOTLIGHT_CORE.page_editor === "oxygen") {
      oxygenEditor(res);
    } else if (WPSPOTLIGHT_CORE.page_editor === "divi") {
      diviEditor(res);
    }
  }

  function elementorEditor(res) {}

  function bricksEditor(res) {}

  function oxygenEditor(res) {}

  function diviEditor(res) {}

  function gutenbergEditor(res) {
    try {
      const { img, title, id } = res;

      // Insert the media as an image block in Gutenberg
      const { createBlock } = wp.blocks;
      const { insertBlock } = wp.data.dispatch("core/block-editor");
      const imageBlock = createBlock("core/image", {
        url: img,
        id: id,
        alt: title,
      });

      insertBlock(imageBlock);
      wp.data
        .dispatch("core/notices")
        .createNotice("success", "Media inserted into Gutenberg editor!", {
          isDismissible: true,
        });
    } catch (error) {
      console.error("Error inserting media:", error);
      wp.data
        .dispatch("core/notices")
        .createNotice("error", "Failed to insert media into Gutenberg editor.", {
          isDismissible: true,
        });
    }
  }

  function editMedia(res) {
    openMediaEditor(res.id);
    // window.open(`${WPSPOTLIGHT_CORE.admin_url}upload.php?item=${res.id}`, "_self");
  }

  const openMediaEditor = (mediaId) => {
    // Configure the media library frame
    const mediaFrame = wp.media({
      title: "Edit Media",
      library: { type: "image" },
      frame: "select",
      button: { text: "Close" },
      multiple: false, // Only allow editing one media item at a time
    });

    // Set the selected media item for editing
    mediaFrame.on("open", () => {
      const selection = mediaFrame.state().get("selection");
      const attachment = wp.media.attachment(mediaId);
      attachment.fetch();
      selection.add(attachment ? [attachment] : []);
    });

    // Open the media frame
    mediaFrame.open();
    popupClose(setStore, 1);
  };

  function deleteMedia(res) {
    const queryParams = { id: res.id };
    const path = addQueryArgs("delete-media", queryParams);

    apiFetch({ path: path, method: "DELETE" }).then((response) => {
      if (response.status === "success") {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    });
  }

  function downloadMedia(res) {
    downloadImage(res.img);
  }

  async function getUnsplashImage() {}

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

    if (selectedCategory?.[0]?.id === "media" && selectedCategory?.length === 1) {
      setStore({
        defaultData: mediaOptions,
        result: [],
        // resTime: 0.3,
        // resultCount: 4,
      });
    } else if (
      selectedCategory?.[1]?.id === "upload_media" &&
      selectedCategory?.length === 2 &&
      !searchText
    ) {
      setStore({
        defaultData: [
          {
            id: "upload_media_drop",
            title: "",
            url: "",
            component: <MediaUpload />,
          },
        ],
        result: [],
        resTime: 0,
        resultCount: 0,
      });
    } else if (
      selectedCategory?.[1]?.id === "insert_media" &&
      selectedCategory?.length === 2 &&
      !searchText
    ) {
      getAllMedia({ callback: true, callbackAction: insertMedia });
    } else if (
      selectedCategory?.[1]?.id === "edit_media" &&
      selectedCategory?.length === 2 &&
      !searchText
    ) {
      getAllMedia({ callback: true, callbackAction: editMedia });
    } else if (
      selectedCategory?.[1]?.id === "delete_media" &&
      selectedCategory?.length === 2 &&
      !searchText
    ) {
      getAllMedia({ callback: true, callbackAction: deleteMedia });
    } else if (
      selectedCategory?.[1]?.id === "download_media" &&
      selectedCategory?.length === 2 &&
      !searchText
    ) {
      getAllMedia({ callback: true, callbackAction: downloadMedia });
    } else if (
      selectedCategory?.[1]?.id === "import_image_unsplash" &&
      selectedCategory?.length === 2 &&
      !searchText
    ) {
      // Unsplash
      getUnsplashImage();
    } else if (selectedCategory?.length === 0) {
      setStore({ defaultData: data });
    }
  }, [selectedCategory, backspace]);

  useEffect(() => {
    if (selectedCategory?.[0]?.id === "media" && selectedCategory?.length === 1) {
      const searchParams = window.location.search || "";
      const isEditPost = searchParams.split("&")?.includes("action=edit");

      setStore({
        defaultData: mediaOptions?.filter((opt) => (isEditPost ? true : opt.id !== "insert_media")),
        result: [],
        // resTime: 0.3,
        // resultCount: 4,
      });
    } else if (
      selectedCategory?.[1]?.id === "upload_media" &&
      selectedCategory?.length === 2 &&
      searchText
    ) {
      setStore({
        defaultData: [
          {
            id: "upload_media_drop",
            title: "",
            url: "",
            component: <MediaUpload />,
          },
        ],
        result: [],
        resTime: 0,
        resultCount: 0,
      });
    } else if (
      selectedCategory?.[1]?.id === "edit_media" &&
      selectedCategory?.length === 2 &&
      searchText
    ) {
      getAllMedia({ searchText });
    } else if (
      selectedCategory?.[1]?.id === "delete_media" &&
      selectedCategory?.length === 2 &&
      searchText
    ) {
      getAllMedia({ searchText, callback: true, callbackAction: deleteMedia });
    } else if (
      selectedCategory?.[1]?.id === "download_media" &&
      selectedCategory?.length === 2 &&
      searchText
    ) {
      getAllMedia({ searchText, callback: true, callbackAction: downloadMedia });
    }
  }, [searchText]);

  return <SearchList />;
};

export default Media;
