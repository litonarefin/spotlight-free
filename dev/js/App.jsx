import React from "react";
import apiFetch from "@wordpress/api-fetch";
import Form from "./components/Form";
import { StoreContext } from "./store/useStore";
import useDataStore from "./store/useDataStore";
import { Toaster } from "react-hot-toast";
import { HotkeysProvider } from "react-hotkeys-hook";
import Settings from "./components/Settings";
import Tourguide from "./components/Tourguide";
import { isTourComplete } from "./store/useDataStore";

apiFetch.use(apiFetch.createRootURLMiddleware(WPSPOTLIGHT_CORE.root));
apiFetch.use(apiFetch.createNonceMiddleware(WPSPOTLIGHT_CORE.apiNonce));

const App = () => {
  return (
    <StoreContext.Provider value={useDataStore()}>
      <HotkeysProvider initiallyActiveScopes={["settings"]}>
        <Form />
        {!isTourComplete ? <Tourguide /> : null}
        <Settings />
        <Toaster
          position="bottom-center"
          reverseOrder={true}
          containerStyle={{ zIndex: "99999999999999999" }}
        />
      </HotkeysProvider>
    </StoreContext.Provider>
  );
};

export default App;
