import React from "react";
import { useStore } from "../store/useStore";

const ResponseCounter = () => {
  const [resTime, _] = useStore((store) => store.resTime);
  const [resultCount, __] = useStore((store) => store.resultCount);

  return (
    <>
      {resultCount ? (
        <p>
          {resultCount} results ({resTime}ms)
        </p>
      ) : null}
    </>
  );
};

export default ResponseCounter;
