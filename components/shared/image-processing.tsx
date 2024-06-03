import React, { useState } from "react";
import axios from "axios";

interface ImageProcessingProps {
  onAddContent: (content: string) => void;
}

const ImageProcessing: React.FC<ImageProcessingProps> = ({ onAddContent }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const handleProcessImage = () => {
    // Example content generated from image processing
    const processedContent = "<p>Processed Image Content</p>";
    onAddContent(processedContent);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleLatex = () => {
    handleUpload();
    handleProcessImage();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("No file selected.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        "http://localhost:3099/upload-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        setUploadStatus("File uploaded successfully.");
        console.log("Response:", response.data);
      } else {
        setUploadStatus("File upload failed.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadStatus("An error occurred during file upload.");
    }
  };

  return (
    <div>
      <h1>Image Upload and Processing</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleLatex}>Upload Image</button>
      {uploadStatus && <p>{uploadStatus}</p>}
    </div>
  );
};

export default ImageProcessing;
