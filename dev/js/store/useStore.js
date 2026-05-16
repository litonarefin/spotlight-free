import { createContext, useContext, useSyncExternalStore } from "react";

export const StoreContext = createContext(null);

export const useStore = (selector) => {
  const store = useContext(StoreContext);
  if (!store) {
    throw "Error";
  }

  const state = useSyncExternalStore(store.subscribe, () => selector(store.get()));
  return [state, store.set];
};
