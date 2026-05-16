import { useState } from "react";
import { getIcon } from "../utils/icons";

function Uploader({ setFile, fileType = "image/*" }) {
  const [isDrag, setIsDrag] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();

    setIsDrag(false);

    const file = e.dataTransfer?.files?.[0];
    if (!file?.name) return;

    handleFile(file);
  };

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setFile({ base64Data: reader.result, fileName: file.name });
      setIsDrag(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDrag(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDrag(false);
  };

  return (
    <div className="jltwp-spotlight-file-uploader">
      <button
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={isDrag ? "jltwp-spotlight-file-dragging" : ""}>
        <input type="file" accept={fileType} onChange={(e) => handleFile(e.target.files[0])} />
        <p>
          {getIcon("uploadCloud")}
          <span>Upload</span>
        </p>
      </button>
    </div>
  );
}

export default Uploader;
