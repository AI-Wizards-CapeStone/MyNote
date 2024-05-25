"use client";

import { useTheme } from "next-themes";
import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { BlockNoteEditor, type PartialBlock } from "@blocknote/core";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useEdgeStore } from "@/lib/edgestore";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
  newContent?: string; // Add newContent prop
}

const Editor = ({
  onChange,
  initialContent,
  editable,
  newContent,
}: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const { edgestore } = useEdgeStore();

  const handleUpload = async (file: File) => {
    const response = await edgestore.publicFiles.upload({ file });
    return response.url;
  };

  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: initialContent
      ? (JSON.parse(initialContent) as PartialBlock[])
      : undefined,
    uploadFile: handleUpload,
  });

  const [content, setContent] = useState(
    initialContent ? (JSON.parse(initialContent) as PartialBlock[]) : []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const newContent = editor.document;
      if (JSON.stringify(newContent) !== JSON.stringify(content)) {
        setContent(newContent);
        onChange(JSON.stringify(newContent, null, 2));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [editor, content, onChange]);

  // Update content when newContent prop changes
  // const [newContents, setNewContents] = useState<string | null>(null);

  // const markdownInputChanged = useCallback(
  //   async (e: ChangeEvent<HTMLTextAreaElement>) => {
  //     // Whenever the current Markdown content changes, parse it to HTML.
  //     setNewContents(e.target.value);
  //   },
  //   []
  // );

  useEffect(() => {
    async function loadInitialHTML() {
      if (newContent) {
        // Parse Markdown to HTML
        // const htmlContent = await editor.tryParseMarkdownToBlocks(newContent);
        // Parse HTML to Blocks
        const blocks = await editor.tryParseHTMLToBlocks(newContent);
        // Insert Blocks
        if (blocks.length > 0) {
          const referenceBlock = editor.document[editor.document.length - 1]; // Insert at the end
          editor.insertBlocks(blocks, referenceBlock, "after");
        }
      }
    }
    loadInitialHTML();
  }, [newContent, editor]);

  // useEffect(() => {
  //   if (newContent) {
  //     const referenceBlock = editor.document[editor.document.length - 1]; // Insert at the end
  //     const blocksToInsert: PartialBlock[] = [
  //       { type: "paragraph", content: newContent },
  //     ];
  //     editor.insertBlocks(blocksToInsert, referenceBlock, "after");
  //   }
  // }, [newContent, editor]);

  return (
    <div>
      <BlockNoteView
        editor={editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
      />
    </div>
  );
};

export default Editor;
