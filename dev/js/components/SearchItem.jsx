import React, { useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import Img from "./Img";
import { getIcon } from "../utils/icons";
import { stringCount } from "../utils/stringCount";
import ProBadge from "./ProBadge";
import Tags from "./Tags";
import toast from "react-hot-toast";

const SearchItem = ({ i, selectedItem, res, handlePremium }) => {
  const [fields, setStore] = useStore((store) => store);
  const { selectedCategory, callback, databaseKey } = fields;

  const resultContainer = useRef(null);

  useEffect(() => {
    if (!resultContainer.current) return;

    resultContainer.current.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [selectedItem]);

  // Set a custom component then return it
  if (res?.component) {
    return res.component;
  }

  return (
    <li
      ref={i === selectedItem ? resultContainer : null}
      {...(res?.disabled ? { style: { opacity: 0.5 } } : {})}
    >
      <a
        href={!res?.dependency && !res?.isPremium ? res?.url : "#"}
        {...(res?.newWindow ? { target: "_blank" } : {})}
        onClick={(e) => {
          // Handle Disabled Item
          if (res?.disabled) {
            if (res?.disabledMessage) toast.error(res.disabledMessage);
            return;
          }

          const isPremium = handlePremium(res?.isPremium);
          // if (isPremium) return;

          // If Premium Features then return
          const lastIndex = selectedCategory?.length - 1;
          if (selectedCategory?.[lastIndex]?.isPremium || (!res?.dependency && res?.isPremium)) {
            e.preventDefault();
            return;
          }

          if (res?.callback) {
            e.preventDefault();
            if (res?.dependency) {
              setStore({
                searchText: "",
                selectedCategory: [...selectedCategory, res],
                result: [],
              });
            }
            return callback(res);
          }

          if (!res?.dependency) return;
          e.preventDefault();

          setStore({
            searchText: "",
            selectedCategory: [...selectedCategory, res],
            result: [],
          });
        }}
        className={selectedItem === i ? `jltwp-spotlight-active` : ""}
      >
        <div className="jltwp-spotlight-title-wrapper">
          {res?.status ? <span className="jltwp-spotlight-status-on" /> : null}
          {res?.status === false ? <span className="jltwp-spotlight-status-off" /> : null}

          {res?.img ? <Img src={res.img} alt={res?.title} /> : null}

          {getIcon(res?.icon)}
          <span
            dangerouslySetInnerHTML={{
              __html: stringCount(res?.title, 50),
            }}
          />
          {res?.direction ? (
            <span className="jltwp-spotlight-direction">{getIcon(res?.direction)}</span>
          ) : null}
        </div>

        {res?.isPremium ? <ProBadge /> : null}

        {res?.tags && !res?.isPremium ? <Tags res={res} databaseKey={databaseKey} /> : null}
      </a>
    </li>
  );
};

export default SearchItem;
