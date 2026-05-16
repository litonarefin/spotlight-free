import React from "react";
import Uploader from "./Uploader";
import toast from "react-hot-toast";
import apiFetch from "@wordpress/api-fetch";
import PremiumFeatureOverlay from "./PremiumFeatureOverlay";

const ThemeUpload = () => {
  const handleUploadTheme = async (data) => {
    const { base64Data, fileName } = data;

    if (base64Data) {
      apiFetch({
        path: `upload-theme`,
        method: "POST",
        data: { theme_data: base64Data, theme_name: fileName },
      }).then((response) => {
        if (response.status === "success") {
          toast.success(response.message);
        }
      });
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <PremiumFeatureOverlay />
      <Uploader setFile={handleUploadTheme} fileType=".zip" />
    </div>
  );
};

export default ThemeUpload;
