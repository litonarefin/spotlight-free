import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { useHotkeys } from "react-hotkeys-hook";
import { isTourComplete } from "../store/useDataStore";
import toast from "react-hot-toast";
import ResponseCounter from "./ResponseCounter";
import PremiumFeatureOverlay from "./PremiumFeatureOverlay";
import ErrorMessage from "./ErrorMessage";
import SelectedCategory from "./SelectedCategory";
import SearchInput from "./SearchInput";
import SearchItem from "./SearchItem";
import LoadingOverlay from "./LoadingOverlay";

const SearchList = () => {
  const [selectedItem, setSelectedItem] = useState(-1);

  const [fields, _setStore] = useStore((store) => store);
  const { defaultData, result, openList, selectedCategory, isLoading } = fields;

  const resultContainer = useRef(null);

  // Click Tab to Down 1 Item
  useHotkeys("Tab", () => {
    if (defaultData?.length - 1 > selectedItem || result?.length - 1 > selectedItem) {
      setSelectedItem((prev) => prev + 1);
    }
  });

  /**
   * Handle Premium Option Or Fields
   * @param {*} item
   */
  const handlePremium = (item) => {
    if (item) {
      toast.error("This is Premium Features. Need Upgrade to Pro");
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!resultContainer.current) return;

    resultContainer.current.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [selectedItem]);

  useEffect(() => {
    setSelectedItem(-1);
  }, [selectedCategory]);

  return (
    <div className="jltwp-spotlight-search">
      <div className="jltwp-spotlight-search-header">
        <ResponseCounter />

        <div className="jltwp-spotlight-search-action">
          <SelectedCategory />
          <SearchInput
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            handlePremium={handlePremium}
          />
        </div>
      </div>

      {openList ? (
        <div className="jltwp-spotlight-search-body">
          <PremiumFeatureOverlay />
          <LoadingOverlay />

          <ul {...(isTourComplete ? {} : { style: { height: "280px" } })}>
            {/* Search for Fuse */}
            {result?.map((res, i) => (
              <SearchItem
                key={i}
                i={i}
                selectedItem={selectedItem}
                res={res.item}
                handlePremium={handlePremium}
              />
            ))}

            {/* Search for Default */}
            {!result?.length &&
              (defaultData || [])?.map((res, i) => (
                <SearchItem
                  key={i}
                  i={i}
                  selectedItem={selectedItem}
                  res={res}
                  handlePremium={handlePremium}
                />
              ))}

            {!result?.length && !defaultData?.length && !isLoading ? <ErrorMessage /> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default SearchList;
