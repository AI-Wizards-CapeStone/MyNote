"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import {
  BlockNoteSchema,
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
import { TbMathFunction } from "react-icons/tb";
// import { LaTexImage } from "./LaTexImage";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
  newContent?: string[] | PartialBlock[]; // Add newContent prop
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
      // lateximg: LaTexImage,

      // latex: LaTex,
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
        setContent(newContent as PartialBlock[]);
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
    group: "Utilize",
    subtext: "Used for a top-level heading",
    icon: <RiFilePdfFill />,
  });

  const [generatedLatex, setGeneratedLatex] = useState("");
  const [LatexImage, setLatexImage] = useState<File | null>(null);
  const [isLatexModalOpen, setIsLatexModalOpen] = useState(false);
  const [loadingtex, setLoadingtex] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddImageClick = () => {
    setIsLatexModalOpen(true);
  };

  const closeLatexModal = async () => {
    setIsLatexModalOpen(false);
    setLatexImage(null);
    setGeneratedLatex("");
  };

  // const handleGeneratedLatex = () => {
  //   const newLatex = generatedLatex;
  //   setGeneratedLatex(newLatex);
  //   insertOrUpdateBlock(editor, {
  //     type: "paragraph",
  //     content: [
        
  //     ],
  //   });
  //   closeLatexModal();
  // };

  const handleLatexFileSelect = (files: FileList) => {
    if (files && files.length > 0) {
      const file = files[0];
      setLatexImage(file);
    }
  };

  const onUploadLatex = async () => {
    if (!LatexImage) return;

    setLoadingtex(true);

    try {
      const formData = new FormData();
      formData.append("image", LatexImage);

      const response = await fetch("http://127.0.0.1:5001/predict", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to upload image file");
      }

      const data = await response.json();
      console.log(data);

      const latextext = data.text;
      setGeneratedLatex(latextext);

      console.log(latextext);
    } catch (error) {
      console.error("Error uploading latex file:", error);
    } finally {
      setLoadingtex(false);
    }
  };

  const fileTypes = ["JPEG", "PNG", "GIF", "JPG"];

  const insertLaTex = (editor: typeof schema.BlockNoteEditor) => ({
    title: "MathType",
    key: "latex",
    subtext: "Used for a top-level heading",
    aliases: ["latex", "heading1", "h1"],
    group: "Utilize",
    onItemClick: async () => {
      handleAddImageClick();
    },
    icon: <TbMathFunction />,
  });

  // latex to image
  // const insertLatexImg = (editor: typeof schema.BlockNoteEditor) => ({
  //   title: "Math",
  //   onItemClick: () => {
  //     insertOrUpdateBlock(editor, {
  //       type: "lateximg",
  //     });
  //   },
  //   aliases: [],
  //   group: "Other",
  //   icon: <TbMathFunction />,
  // });

  useEffect(() => {
    const loadInitialHTML = async () => {
      if (newContent && Array.isArray(newContent)) {
        const [generatedText, audioUrl] = newContent;
        const blocks = await editor.tryParseMarkdownToBlocks(
          String(generatedText)
        );

        if (blocks.length > 0) {
          const referenceBlock = editor.document[editor.document.length - 1]; // Insert at the end
          editor.insertBlocks(
            blocks,
            referenceBlock,
            "after"
          );
        }
      }
    };

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
              [
                insertPDF(editor),
                // insertLaTex(editor),
                // insertLatexImg(editor),
                ...getDefaultReactSlashMenuItems(editor),
              ],
              query
            )
          }
        />
      </BlockNoteView>
    </div>
  );
};

export default Editor;
