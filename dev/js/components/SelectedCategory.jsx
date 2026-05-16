import React, { memo } from "react";
import { useStore } from "../store/useStore";
import { getIcon } from "../utils/icons";
import { stringCount } from "../utils/stringCount";

const SelectedCategory = memo(() => {
  const [selectedCategory, setStore] = useStore((store) => store.selectedCategory);
  const [backspace, _setStore] = useStore((store) => store.backspace);

  return (
    <>
      {selectedCategory?.length ? (
        <div className="jltwp-spotlight-selected-category-wrapper">
          {selectedCategory?.map((item, i) => (
            <div className="jltwp-spotlight-selected-category" key={i}>
              <span
                dangerouslySetInnerHTML={{
                  __html: stringCount(item?.title, 15),
                }}
              />
              <span
                className="jltwp-spotlight-category-close"
                onClick={() => {
                  setStore({
                    backspace: !backspace,
                  });
                }}>
                {getIcon("close")}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
});

export default SelectedCategory;
