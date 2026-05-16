import React from "react";
import Uploader from "./Uploader";
import toast from "react-hot-toast";
import apiFetch from "@wordpress/api-fetch";
import PremiumFeatureOverlay from "./PremiumFeatureOverlay";

const PluginUpload = () => {
  const handleUploadPlugin = async (data) => {
    const { base64Data, fileName } = data;

    if (base64Data) {
      apiFetch({
        path: `upload-plugin`,
        method: "POST",
        data: { plugin_data: base64Data, plugin_name: fileName },
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
      <Uploader setFile={handleUploadPlugin} fileType=".zip" />
    </div>
  );
};

export default PluginUpload;
