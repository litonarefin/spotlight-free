import apiFetch from "@wordpress/api-fetch";
import React, { useEffect, useState } from "react";

const useKeyData = (setStore = null) => {
  const [keyData, setKeyData] = useState({});

  useEffect(() => {
    apiFetch({ path: "keymaps" }).then((response) => {
      setKeyData(response?.data || {});
      if (setStore) {
        setStore({ databaseKey: response?.data || {} });
      }
    });
  }, []);

  return { ...keyData };
};

export default useKeyData;
