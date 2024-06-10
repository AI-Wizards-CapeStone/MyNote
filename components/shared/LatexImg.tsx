/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/img-redundant-alt */
"use client";
import { useState, useRef, useEffect } from "react";
import { createReactBlockSpec } from "@blocknote/react";
import axios from "axios";
import { getImage, saveImage } from "./indexedDB"; // Import the IndexedDB utility

export const LaTexImage = createReactBlockSpec(
  {
    type: "lateximg",
    propSchema: {
      name: {
        default: "" as const,
      },
      url: {
        default: "" as const,
      },
      caption: {
        default: "" as const,
      },
      showPreview: {
        default: true,
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      const [image, setImage] = useState(null);
      const [loading, setLoading] = useState(false);
      const fileInputRef = useRef(null);

      useEffect(() => {
        // Retrieve the image from IndexedDB when the component mounts
        const fetchImage = async () => {
          const storedImage = await getImage(props.block.id);
          if (storedImage) {
            setImage(storedImage);
          }
        };
        fetchImage();
      }, []);

      // Function to handle input changes (file upload)
      const handleInputChange = async () => {
        setLoading(true);
        const file = fileInputRef.current.files[0];
        if (file && file.type.startsWith("image/")) {
          const formData = new FormData();
          formData.append("file", file);

          try {
            const response = await axios.post(
              "http://localhost:9000/render-latex",
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            const url = response.data.url;
            const newImage = { id: props.block.id, url };
            setImage(newImage);
            await saveImage(newImage); // Store the image in IndexedDB
          } catch (error) {
            console.error("Error uploading file:", error);
          } finally {
            setLoading(false);
          }
        } else {
          console.error("Invalid file type. Please upload an image.");
        }
      };

      // Function to handle loading image from clipboard
      const handleLoadFromClipboard = async () => {
        setLoading(true);
        try {
          const clipboardItems = await navigator.clipboard.read();
          for (const item of clipboardItems) {
            for (const type of item.types) {
              if (type.startsWith("image/")) {
                const blob = await item.getType(type);
                const formData = new FormData();
                formData.append("file", blob);

                const response = await axios.post(
                  "http://localhost:9000/render-latex",
                  formData,
                  {
                    headers: {
                      "Content-Type": "multipart/form-data",
                    },
                  }
                );

                const url = response.data.url;
                const newImage = { id: props.block.id, url };
                setImage(newImage);
                await saveImage(newImage); // Store the image in IndexedDB
                break;
              }
            }
          }
        } catch (error) {
          console.error("Error reading from clipboard:", error);
        } finally {
          setLoading(false);
        }
      };

      const containerStyle = {
        display: "flex",
        width: "190px",
        justifyContent: "center",
        alignItems: "center",
        height: "6vh",
      };

      const imageStyle = {
        // width: "220px",
        height: "auto",
      };

      return (
        <div style={containerStyle}>
          {!image && (
            <>
              {/* <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg, image/png, image/gif"
                  onChange={handleInputChange}
                /> */}
              <button
                onClick={handleLoadFromClipboard}
                style={{
                  backgroundColor: "blue", // Example background color
                  color: "white", // Example text color
                  padding: "5px 5px", // Example padding
                  margin: "5px 0px", // Example padding
                  border: "none", // Remove default border
                  borderRadius: "5px", // Example rounded corners
                  cursor: "pointer", // Change cursor to pointer on hover
                }}
              >
                Load from Clipboard
              </button>
              {loading && <div>Loading...</div>}
            </>
          )}
          {image && (
            <img
              src={image.url}
              alt="Rendered LaTeX Image"
              style={imageStyle}
            />
          )}
          {/* <div className={"inline-content"} ref={props.contentRef} /> */}
        </div>
      );
    },
  }
);
