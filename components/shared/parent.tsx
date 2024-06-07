// pages/editor.js
import { useState } from "react";
import Editor from "./editor";

const EditorPage = () => {
  const [editorContent, setEditorContent] = useState("");
  const [newContent, setNewContent] = useState("");

  const handleEditorChange = (value:any) => {
    setEditorContent(value);
  };

  const handleAddContent = () => {
    setNewContent("This is the new text content!"); // Example content to add
  };

  return (
    <div>
      <h1>Editor Page</h1>
      <button onClick={handleAddContent}>Add Text</button>
      <Editor
        onChange={handleEditorChange}
        initialContent={JSON.stringify([
          { type: "paragraph", context: newContent}
        ])}
        editable={true}
        newContent={newContent} // Pass newContent prop
      />
      <div>
        <h2>Editor Output</h2>
        <pre>{editorContent}</pre>
      </div>
    </div>
  );
};

export default EditorPage;
