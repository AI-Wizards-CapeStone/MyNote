"use client";

import { useTheme } from "next-themes";
import { useState, useEffect, useCallback, ChangeEvent } from "react";
import {
  BlockIdentifier,
  BlockNoteEditor,
  BlockNoteSchema,
  StyledText,
  defaultBlockSpecs,
  filterSuggestionItems,
  insertOrUpdateBlock,
  type PartialBlock,
} from "@blocknote/core";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import {
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useEdgeStore } from "@/lib/edgestore";
import { PDF } from "./PDF";
import { RiFilePdfFill } from "react-icons/ri";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
  newContent?: string | PartialBlock[]; // Add newContent prop
}

// type BlockIdentifier = string | Block;

const Editor = ({ onChange, initialContent, newContent }: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const { edgestore } = useEdgeStore();

  const handleUpload = async (file: File) => {
    const response = await edgestore.publicFiles.upload({ file });
    return response.url;
  };

  const schema = BlockNoteSchema.create({
    blockSpecs: {
      // Adds all default blocks.
      ...defaultBlockSpecs,
      // Adds the PDF block.
      pdf: PDF,
    },
  });

  const editor = useCreateBlockNote({
    schema,
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

  // Slash menu item to insert a PDF block
  const insertPDF = (editor: typeof schema.BlockNoteEditor) => ({
    title: "PDF",
    onItemClick: () => {
      insertOrUpdateBlock(editor, {
        type: "pdf",
      });
    },
    aliases: ["pdf", "document", "embed", "file"],
    group: "Other",
    icon: <RiFilePdfFill />,
  });

  // type BlockIdentifier = string | PartialBlock;

  // const blockidentifier: BlockIdentifier = '';

  useEffect(() => {
    async function loadInitialHTML() {
      if (newContent) {
        // Parse Markdown to HTML
        // const htmlContent = await editor.tryParseMarkdownToBlocks(newContent);
        // Parse HTML to Blocks
        const blocks = await editor.tryParseMarkdownToBlocks(
          Array.isArray(newContent) ? JSON.stringify(newContent) : newContent
        );
        // Insert Blocks
        if (blocks.length > 0) {
          const referenceBlock = editor.document[0]; // Insert at the end
          editor.insertBlocks(blocks, referenceBlock, "before");
        }
      }
    }
    loadInitialHTML();
  }, [newContent, editor]);

  return (
    <div>
      <BlockNoteView
        editor={editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={async (query) =>
            // Gets all default slash menu items and `insertPDF` item.
            filterSuggestionItems(
              [insertPDF(editor), ...getDefaultReactSlashMenuItems(editor)],
              query
            )
          }
        />
      </BlockNoteView>
    </div>
  );
};

export default Editor;
