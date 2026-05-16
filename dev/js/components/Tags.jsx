import React, { memo } from "react";
import { useStore } from "../store/useStore";

const getKeyFormat = (keyStr) => {
  if (!keyStr) return;

  const keys = keyStr.split("+");

  const tags = [];

  keys.forEach((key, i) => {
    tags.push({ name: key.charAt(0).toUpperCase() + key.slice(1), bg: true });
    if (keys?.length - 1 > i) {
      tags.push({ name: "+" });
    }
  });

  return tags || [];
};

const Tags = memo(({ res }) => {
  const [databaseKey, _setStore] = useStore((store) => store.databaseKey);

  return (
    <div className="jltwp-spotlight-tags">
      {(getKeyFormat(databaseKey[res.id]) || res.tags).map((tag, i) => (
        <span
          key={i}
          {...(tag.bg
            ? { className: "jltwp-spotlight-tag-badge" }
            : {
                style: { paddingLeft: "5px", paddingRight: "5px", fontSize: "1rem" },
              })}>
          {tag.name}
        </span>
      ))}
    </div>
  );
});

export default Tags;
