import React, { useEffect } from "react";
import { useCompletion } from "ai/react"; // Adjust the import path to where your custom hook is defined
import editor from "react-markdown-editor-lite/cjs/editor";

const MyComponent = () => {
  const { complete } = useCompletion({
    id: "hackathon_starter",
    api: "/api/generate",
    onResponse: (response) => {
      if (response.status === 429) {
        return;
      }
      if (response.body) {
        const reader = response.body.getReader();
        let decoder = new TextDecoder();
        reader.read().then(function processText({ done, value }) {
          if (done) {
            return;
          }
          let chunk = decoder.decode(value, { stream: true });
        //   editor?._tiptapEditor.commands.insertContent(chunk);
          reader.read().then(processText);
        });
      } else {
        console.error("Response body is null");
      }
    },
    onError: (e) => {
      console.error(e.message);
    },
  });

  useEffect(() => {
    console.log(complete);
    // Optionally, call complete() here or based on some other logic
  }, [complete]);

  return <div className={"bn-file-block-content-wrapper"}></div>;
};

export default MyComponent;
