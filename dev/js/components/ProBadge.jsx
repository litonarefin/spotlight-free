import React, { memo } from "react";
import { getIcon } from "../utils/icons";

const ProBadge = memo(() => {
  return (
    <div className="jltwp-spotlight-pro-badge">
      {getIcon("king")}
      PRO
    </div>
  );
});

export default ProBadge;
