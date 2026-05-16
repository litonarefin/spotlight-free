import React from "react";
import { useStore } from "../store/useStore";

const LoadingOverlay = () => {
  const [isLoading, _setStore] = useStore((store) => store.isLoading);

  return (
    <>
      {isLoading ? (
        <div className="jltwp_spotlight_loading_overlay">
          <div className="jltwp_loader" />
        </div>
      ) : null}
    </>
  );
};

export default LoadingOverlay;
