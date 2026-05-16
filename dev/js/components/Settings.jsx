import { Fragment, useEffect, useRef, useState } from "react";
import {
  backendMenuData,
  defaultMainOptions,
  defaultSettingsOptions,
  frontendMenuData,
} from "../data/data";
import { getIcon } from "../utils/icons";
import apiFetch from "@wordpress/api-fetch";
import toast from "react-hot-toast";
import { useStore } from "../store/useStore";
import Tags from "./Tags";
import { useHotkeys } from "react-hotkeys-hook";

export const handleOpenSettings = (action) => {
  action({ openSettings: true, openPopup: false });
};

const Settings = () => {
  const [openInput, setOpenInput] = useState(null);
  const [inputKeys, setInputKeys] = useState({});
  const [addedKeys, setAddedKeys] = useState({});

  const [openSettings, setStore] = useStore((store) => store.openSettings);

  const settingsRef = useRef();

  useHotkeys("esc", () => {
    setStore({ openSettings: false });
  });

  const handleReset = () => {
    apiFetch({ path: "keymaps", method: "POST", body: JSON.stringify({}) }).then((response) => {
      if (response.status === "success") {
        toast.success("Restored Key Bindings Successfully");
      } else {
        toast.error("Nothing To Restore Data");
      }
    });
  };

  const getKeyLength = (key = "") => {
    const keyArr = key.split("+");

    if (keyArr?.length >= 4) {
      toast("Maximum 4 keys allow", {
        style: {
          border: "1px solid yellow",
          background: "#FFB700",
        },
      });
    }

    return keyArr?.length || 0;
  };

  const handleKeyAdd = (e) => {
    const id = e.target.name;
    const eKey = e.key;

    let key = "";
    if (eKey === " ") {
      key = "Space";
    } else if (eKey === "Control") {
      key = "Ctrl";
    } else {
      key = eKey;
    }

    if ((addedKeys[id] || "").split("+").length > 3) {
      key = "";
    }

    setAddedKeys({
      ...addedKeys,
      [id]: addedKeys[id] && getKeyLength(addedKeys[id]) < 4 ? `${addedKeys[id]}+${key}` : key,
    });
  };

  const handleSaveSettings = () => {
    setOpenInput(null);

    apiFetch({ path: "keymaps", method: "POST", body: JSON.stringify(inputKeys) }).then(
      (response) => {
        setStore({ databaseKey: inputKeys });
        if (response.status === "success") {
          toast.success("Key Bindings Saved Successfully");
        }
      }
    );
  };

  const handleClickOutside = (event) => {
    if (settingsRef.current && !settingsRef.current.contains(event.target)) {
      setStore({ openSettings: false });
    }
  };

  useEffect(() => {
    const settingsDiv = document.querySelector(".plugins-php #wp-spotlight-settings");
    if (settingsDiv) {
      settingsDiv.addEventListener("click", () => {
        setStore({ openSettings: true });
      });
    }

    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  useEffect(() => {
    apiFetch({ path: "keymaps" }).then((response) => {
      setInputKeys(response?.data || {});
    });
  }, []);

  useEffect(() => {
    setInputKeys({ ...inputKeys, ...addedKeys });
  }, [addedKeys]);

  return (
    <Fragment>
      {openSettings ? (
        <div className="jltwp-spotlight-settings-overlay">
          <div className="jltwp-spotlight-settings-wrapper">
            <div className="jltwp-spotlight-setting" ref={settingsRef}>
              <div className="jltwp-spotlight-setting-header">
                <span>Title</span>
                <span>Default</span>
                <span>Custom Key(s)</span>
              </div>
              <div className="jltwp-spotlight-setting-body">
                <ul className="jltwp-spotlight-settings-items">
                  {[
                    ...Object.values(defaultSettingsOptions),
                    ...defaultMainOptions,
                    ...Object.values(frontendMenuData),
                    ...Object.values(backendMenuData),
                  ].map((item, index) => (
                    <li className="jltwp-spotlight-settings-item" key={item.id || index}>
                      <a href="#" onDoubleClick={() => setOpenInput(index)}>
                        <div className="jltwp-spotlight-item-title">
                          {item?.icon ? getIcon(item.icon) : null}
                          <span>{item?.title}</span>
                        </div>
                        <div className="jltwp-spotlight-default-key">
                          {item?.shortcutKey ? <Tags res={item} databaseKey={{}} /> : null}
                        </div>
                        <div className="jltwp-spotlight-custom-key-wrapper">
                          <div className="jltwp-spotlight-custom-key">
                            {openInput === index ? (
                              <input
                                name={item?.id}
                                value={inputKeys[item?.id] ? inputKeys[item?.id] : ""}
                                onChange={() => {}}
                                onBlur={handleSaveSettings}
                                onKeyDown={handleKeyAdd}></input>
                            ) : (
                              <Tags res={{ id: item.id, tags: [] }} databaseKey={inputKeys} />
                            )}
                          </div>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="jltwp-spotlight-setting-footer">
                <button
                  type="button"
                  className="jltwp-spotlight-restore-default"
                  onClick={handleReset}>
                  Restore Defaults
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Fragment>
  );
};

export default Settings;
