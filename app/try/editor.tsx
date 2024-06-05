"use client";

import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { uploadFileServerAction } from "./actions";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
// editor.tsx client component

export default function Editor() {
  // Creates a new editor instance.
  const editor = useCreateBlockNote({
    uploadFile: (file: File) => {
      const form = new FormData();
      form.append("fileUpload", file);
      return uploadFileServerAction(form);
    },
  });

  // Renders the editor instance using a React component.
  return <BlockNoteView editor={editor} />;
}
