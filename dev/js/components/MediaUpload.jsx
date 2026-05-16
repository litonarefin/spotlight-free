import React, { useState } from "react";
import Uploader from "./Uploader";
import toast from "react-hot-toast";
import apiFetch from "@wordpress/api-fetch";
import PremiumFeatureOverlay from "./PremiumFeatureOverlay";

const MediaUpload = () => {
  const [uploadedImages, setUploadedImages] = useState([]);

  const handleUploadMedia = async (data) => {
    const { base64Data, fileName } = data;

    if (base64Data) {
      apiFetch({
        path: `upload-media`,
        method: "POST",
        data: { media_data: base64Data, media_name: fileName },
      }).then((response) => {
        if (response.status === "success") {
          setUploadedImages([...uploadedImages, response.url]);
          toast.success(response.message);
        }
      });
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <PremiumFeatureOverlay />
      <Uploader setFile={handleUploadMedia} />

      {uploadedImages?.length ? (
        <div className="jltwp-spotlight-uploaded-media">
          {uploadedImages?.map((img, i) => (
            <figure key={i}>
              <img src={img} alt="Preview Image" />
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default MediaUpload;
