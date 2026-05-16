import React from "react";
import { useStore } from "../store/useStore";

const ErrorMessage = () => {
  const [errorMessage, _setStore] = useStore((store) => store.errorMessage);

  return <li className="jltwp-spotlight-not-data">{errorMessage || "Not Data Found!"}</li>;
};

export default ErrorMessage;
