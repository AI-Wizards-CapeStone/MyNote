"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";

const ImageFromClipboard: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    const readClipboard = async () => {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith("image/")) {
            const blob = await clipboardItem.getType(type);
            const reader = new FileReader();
            reader.onload = function (event) {
              if (event.target && event.target.result) {
                setImageSrc(event.target.result as string);
              }
            };
            reader.readAsDataURL(blob);
            return; // Exit the loop after the first image is found
          }
        }
      }
    };

    const handlePaste = async (event: ClipboardEvent) => {
      if (!event.clipboardData) return;
      const items = event.clipboardData.items;

      for (let i = 0; i < items.length; i++) {
        if (items[i] && items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = function (event) {
              if (event.target && event.target.result) {
                setImageSrc(event.target.result as string);
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  const handleLoadButtonClick = async () => {
    const clipboardItems = await navigator.clipboard.read();
    for (const clipboardItem of clipboardItems) {
      for (const type of clipboardItem.types) {
        if (type.startsWith("image/")) {
          const blob = await clipboardItem.getType(type);
          const reader = new FileReader();
          reader.onload = function (event) {
            if (event.target && event.target.result) {
              setImageSrc(event.target.result as string);
            }
          };
          reader.readAsDataURL(blob);
          return; // Exit the loop after the first image is found
        }
      }
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      {/* <h2>Paste an image from your clipboard</h2> */}
      {imageSrc ? (
        <img
          src={imageSrc}
          alt="Pasted from clipboard"
          style={{ maxWidth: "100%", maxHeight: "80vh" }}
        />
      ) : (
        <div>No image</div>
      )}
      <div>
        {/* <p>No image found in clipboard.</p> */}
        {/* <button onClick={handleLoadButtonClick}>Load from clipboard</button> */}
        <Button
          className="my-3 ml-2 text-xs text-muted-foreground"
          variant="outline"
          size="sm"
          onClick={handleLoadButtonClick}
        >
          Load from clipboard or Ctrl + V
        </Button>
      </div>
    </div>
  );
};

export default ImageFromClipboard;
