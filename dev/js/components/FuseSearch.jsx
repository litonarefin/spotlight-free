import React, { useEffect } from "react";
import Users from "./api/Users";
import { useStore } from "../store/useStore";
import Plugins from "./api/Plugins";
import Themes from "./api/Themes";
import SearchList from "./SearchList";
const Fuse = require("fuse.js");
import Media from "./api/Media";
import PostTypes from "./api/PostTypes";
import Create from "./api/Create";
import DarkLightMode from "./api/DarkLightMode";
import Multisite from "./api/Multisite";
import Update from "./api/Update";

const FuseSearch = () => {
  const [fields, setStore] = useStore((store) => store);
  const { defaultData, searchText, selectedCategory } = fields;

  useEffect(() => {
    const fuseOptions = {
      // isCaseSensitive: false,
      // includeScore: false,
      // shouldSort: true,
      // includeMatches: false,
      // findAllMatches: false,
      // minMatchCharLength: 1,
      // location: 0,
      // threshold: 0.6,
      // distance: 100,
      // useExtendedSearch: false,
      useExtendedSearch: true,
      // ignoreLocation: false,
      // ignoreFieldNorm: false,
      // fieldNormWeight: 1,
      // keys: ["title", "author.firstName"],
      // ----- USER -----
      keys: ["title", "url", "slug", "data.title"],
    };

    const fuse = new Fuse(defaultData, fuseOptions);

    const result = fuse.search(searchText);
    setStore({ result: result });
  }, [searchText]);

  return (
    <div className="jltwp-spotlight-search-wrapper">
      {selectedCategory?.length === 0 ? <SearchList /> : null}
      {selectedCategory?.[0]?.id === "users" ? <Users /> : null}
      {selectedCategory?.[0]?.id === "plugins" ? <Plugins /> : null}
      {selectedCategory?.[0]?.id === "themes" ? <Themes /> : null}
      {selectedCategory?.[0]?.id === "media" ? <Media /> : null}
      {selectedCategory?.[0]?.id === "post_types" ? <PostTypes /> : null}
      {selectedCategory?.[0]?.id === "create" ? <Create /> : null}
      {selectedCategory?.[0]?.id === "update" ? <Update /> : null}
      {selectedCategory?.[0]?.id === "dark_light_mode" ? <DarkLightMode /> : null}
      {selectedCategory?.[0]?.id === "multisite" ? <Multisite /> : null}
    </div>
  );
};

export default FuseSearch;
