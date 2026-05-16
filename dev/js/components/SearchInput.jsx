import React, { memo, useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { defaultSettingsOptions } from "../data/data";
import { handleOpenSettings } from "./Settings";
import { getIcon } from "../utils/icons";
import toast from "react-hot-toast";

const SearchInput = memo(({ selectedItem, setSelectedItem, handlePremium }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef(null);

  const [fields, setStore] = useStore((store) => store);
  const {
    defaultData,
    searchText,
    result,
    selectedCategory,
    callback,
    databaseKey,
    openList,
    delaySearch,
  } = fields;

  const debounce = (onChange) => {
    let timeout;
    return (e) => {
      const form = e.currentTarget.value;
      if (delaySearch) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          onChange(form);
        }, 300);
      } else {
        onChange(form);
      }
    };
  };

  const handleKeyDown = (e) => {
    // If Premium Features then return
    const lastIndex = selectedCategory?.length - 1;

    if (!openList) {
      setStore({ openList: true });
    }

    if (e.key === "ArrowUp" && selectedItem > 0) {
      // If Premium Features then return
      if (selectedCategory?.[lastIndex]?.isPremium) return;

      setSelectedItem((prev) => prev - 1);
    } else if (e.key === "ArrowDown" && selectedItem < result?.length - 1) {
      // If Premium Features then return
      if (selectedCategory?.[lastIndex]?.isPremium) return;

      setSelectedItem((prev) => prev + 1);
    } else if (
      e.key === "ArrowDown" &&
      selectedItem < defaultData?.length - 1 &&
      result?.length === 0
    ) {
      // If Premium Features then return
      if (selectedCategory?.[lastIndex]?.isPremium) return;

      setSelectedItem((prev) => prev + 1);
    } else if (e.key === "Enter" && selectedItem >= 0) {
      const selectList = defaultData[selectedItem] || result[selectedItem]?.item;
      // Handle Disabled Item
      if (selectList?.disabled || selectList?.item?.disabled) {
        // Show Toast Message if Set
        if (selectList?.disabledMessage || selectList?.item?.disabledMessage)
          toast.error(selectList?.disabledMessage || selectList?.item?.disabledMessage);
        // Finally return
        return;
      }

      const isPremium = handlePremium(
        defaultData[selectedItem]?.isPremium || result[selectedItem]?.item?.isPremium
      );

      // If Premium Features then return
      if (
        selectedCategory?.[lastIndex]?.isPremium ||
        (!result[selectedItem]?.item?.dependency && result[selectedItem]?.item?.isPremium) ||
        (!defaultData[selectedItem]?.dependency &&
          !result?.length &&
          defaultData[selectedItem]?.isPremium)
      )
        return;

      if (result[selectedItem]?.item?.dependency) {
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        setStore({
          searchText: "",
          selectedCategory: [...selectedCategory, result[selectedItem]?.item],
          result: [],
          defaultData: result[selectedItem]?.item?.items || [],
        });
        if (result[selectedItem]?.item?.callback) {
          callback(result[selectedItem]?.item);
        }
      } else if (result[selectedItem]?.item?.callback) {
        if (result[selectedItem]?.item?.dependency) {
          setStore({
            searchText: "",
            selectedCategory: [...selectedCategory, result[selectedItem]?.item],
            result: [],
            defaultData: result[selectedItem]?.item?.items || [],
          });
        }
        callback(result[selectedItem]?.item);
      } else if (defaultData[selectedItem]?.dependency && !result?.length) {
        setStore({
          searchText: "",
          selectedCategory: [...selectedCategory, defaultData[selectedItem]],
          result: [],
          defaultData: defaultData[selectedItem]?.items || [],
        });
        if (defaultData[selectedItem]?.callback) {
          callback(defaultData[selectedItem]);
        }
      } else if (defaultData[selectedItem]?.callback && !result?.length) {
        if (defaultData[selectedItem]?.dependency) {
          if (inputRef.current) {
            inputRef.current.value = "";
          }
          setStore({
            searchText: "",
            selectedCategory: [...selectedCategory, defaultData[selectedItem]],
            result: [],
            defaultData: defaultData[selectedItem]?.items || [],
          });
        }
        callback(defaultData[selectedItem]);
      } else {
        if (searchText) {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            window.open(result[selectedItem]?.item?.url, "_blank");
          } else {
            window.open(
              result[selectedItem]?.item?.url,
              result[selectedItem]?.item?.newWindow ? "_blank" : "_self"
            );
          }
        } else {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            window.open(defaultData[selectedItem]?.url, "_blank");
          } else {
            window.open(
              defaultData[selectedItem]?.url,
              defaultData[selectedItem]?.newWindow ? "_blank" : "_self"
            );
          }
        }
      }
    } else if (e.key == "Backspace" && !searchText && selectedCategory?.length > 0) {
      setStore({ backspace: true, isLoading: false });
    } else if (
      e.key === defaultSettingsOptions.close_spotlight.shortcutKey &&
      !databaseKey?.close_spotlight
    ) {
      setStore({ openPopup: false, openList: false });
    } else if (e.key === "Tab") {
      if (defaultData?.length - 1 > selectedItem || result?.length - 1 > selectedItem) {
        setSelectedItem((prev) => prev + 1);
      }
    }
  };

  useEffect(() => {
    // Handle Key binding
    setStore({ callback: () => handleOpenSettings(setStore) });

    let inputTimeout = setTimeout(() => {
      inputRef.current && inputRef.current.focus();
    }, 5);

    return () => clearTimeout(inputTimeout);
  }, []);

  useEffect(() => {
    setStore({ searchText: searchQuery });
  }, [searchQuery]);

  return (
    <div className="jltwp-spotlight-search-input">
      {getIcon("search")}
      <input
        ref={inputRef}
        type="text"
        placeholder="Spotlight Search..."
        // value={searchQuery}
        // onChange={(e) => {
        //     setSearchQuery(e.target.value);
        // }}
        onChange={debounce((e) => {
          setSearchQuery(e);
        })}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
});

export default SearchInput;
