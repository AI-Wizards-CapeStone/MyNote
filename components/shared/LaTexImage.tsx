/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable jsx-a11y/img-redundant-alt */
/* eslint-disable no-console */
"use client";
import { useState, useEffect } from "react";
import { createReactBlockSpec } from "@blocknote/react";
import axios from "axios";
// const [image, setImage] = useState("");

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
      // const [imageURL, setImageURL] = useState("");
      const [image, setImage] = useState<{ id: string; url: any } | null>(null);
      const [loading, setLoading] = useState(false);

      useEffect(() => {
        // Load the image URL from the server on mount
        const loadImageURL = async () => {
          try {
            const response = await axios.get(
              `http://localhost:9000/image/${props.block.id}`
            );

            // console.log(response.data.url)
            const url = response.data.url;
            const newImage = { id: props.block.id, url };
            if (response.data.url) {
              setImage(newImage);
            }
          } catch (error) {
            console.error("Error loading image URL:", error);
          }
        };

        loadImageURL();
      }, []);

      // Function to handle input changes (file upload)
      // const handleInputChange = async (event) => {
      //   const file = event.target.files[0];
      //   if (file && file.type.startsWith("image/")) {
      //     const formData = new FormData();
      //     formData.append("file", file);

      //     setLoading(true);
      //     try {
      //       const response = await axios.post(
      //         "http://localhost:9000/render-latex",
      //         formData,
      //         {
      //           headers: {
      //             "Content-Type": "multipart/form-data",
      //           },
      //         }
      //       );

      //       const imageURL = response.data.url;
      //       setImageURL(imageURL);

      //       // Save the image URL to the server
      //       await axios.post("http://localhost:9000/save-image", {
      //         id: props.block.id,
      //         url: imageURL,
      //       });

      //       console.log("Image URL saved successfully.");
      //     } catch (error) {
      //       console.error("Error uploading file:", error);
      //     } finally {
      //       setLoading(false);
      //     }
      //   } else {
      //     console.error("Invalid file type. Please upload an image.");
      //   }
      // };

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

                await axios.post("http://localhost:9000/save-image", {
                  id: props.block.id,
                  url: url,
                });
    
                // console.log("Image URL saved successfully.");
                // console.log(url);

                setImage(newImage);
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
        justifyContent: "center",
        alignItems: "center",
        height: "auto",
      };

      const imageStyle = {
        width: "50%",
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
