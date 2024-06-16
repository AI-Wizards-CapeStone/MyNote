"use client";

import Modal from "react-modal";
import { Button } from "@/components/ui/button";
import { FileUploader } from "react-drag-drop-files";
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
import {
  BlockNoteView,
} from "@blocknote/mantine";
import { useEdgeStore } from "@/lib/edgestore";
import { PDF } from "./PDF";
import { RiFilePdfFill } from "react-icons/ri";
import { TbMathFunction } from "react-icons/tb";

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

  const handleGeneratedLatex = () => {
    const newLatex = generatedLatex;
    setGeneratedLatex(newLatex);
    insertOrUpdateBlock(editor, {
      type: "paragraph",
      content: [
        {
          type: "latex",
          props: {
            open: true,
          },
          content: generatedLatex,
        },
      ],
    });
    closeLatexModal();
  };

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


  useEffect(() => {
    const loadInitialHTML = async () => {
      if (newContent && Array.isArray(newContent)) {
        const [generatedText, audioUrl] = newContent;
        const blocks = await editor.tryParseMarkdownToBlocks(String(generatedText));
        
        if (blocks.length > 0) {
          const referenceBlock = editor.document[editor.document.length - 1]; // Insert at the end
          editor.insertBlocks(
            [
              {
                type: "audio",
                props: {
                  url: audioUrl,
                },
                children: blocks
              },
            ],
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
                insertLaTex(editor),
                ...getDefaultReactSlashMenuItems(editor),
              ],
              query
            )
          }
        />
      </BlockNoteView>
      <Modal
        isOpen={isLatexModalOpen}
        onRequestClose={closeLatexModal}
        ariaHideApp={false}
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            transition: "opacity 0.3s ease", // Smooth overlay transition
          },
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            padding: "20px",
            borderRadius: "8px",
            width: "600px", // Increase the width
            height: "400px", // Increase the height
            backgroundColor: "#90aeae", // Change background color
            transition: "all 0.3s ease", // Smooth content transition
          },
        }}
      >
        <div className="upload-style">
          <FileUploader
            multiple={true}
            handleChange={handleLatexFileSelect}
            name="file"
            types={fileTypes}
          />
          <p>
            {LatexImage
              ? `Image name: ${LatexImage.name}`
              : "no files uploaded yet"}
          </p>
        </div>

        {/* <input type="file" onChange={handleAudioFileSelect} /> */}

        <div className="mt-4 flex justify-end">
          <Button
            className="text-xs text-muted-foreground"
            variant="outline"
            size="sm"
            onClick={onUploadLatex}
          >
            Image to latex!
          </Button>
          <Button
            className="ml-2 text-xs text-muted-foreground"
            variant="outline"
            size="sm"
            onClick={closeLatexModal}
          >
            Cancel
          </Button>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          generatedLatex && (
            <div className="mt-4">
              <h3>Generated Latex:</h3>
              <p>{generatedLatex}</p>
              <Button
                className="mt-2 text-xs text-muted-foreground"
                variant="outline"
                size="sm"
                onClick={handleGeneratedLatex}
              >
                Add to Editor
              </Button>
            </div>
          )
        )}
      </Modal>
    </div>
  );
};

export default Editor;
