"use client";

import React, { ElementRef, useRef, useState } from "react";
import Modal from "react-modal";
import { useMutation } from "convex/react";
import TextareaAutosize from "react-textarea-autosize";
import { ImageIcon, Smile, X, FileAudio, FilePenLine,  Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconPicker } from "./icon-picker";

import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { FileUploader } from "react-drag-drop-files";
import { useCoverImage } from "@/hooks/use-cover-image";

import { marked } from "marked";
import { update } from "@/convex/documents";

interface ToolbarProps {
  initialData: Doc<"documents">;
  preview?: boolean;
  onAddContent: (content: string) => void;
}

export const Toolbar = ({
  initialData,
  preview,
  onAddContent,
}: ToolbarProps) => {
  const inputRef = useRef<ElementRef<"textarea">>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialData.title);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  const update = useMutation(api.documents.update);
  const removeIcon = useMutation(api.documents.removeIcon);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  // const [LatexImage, setLatexImage] = useState<File | null>(null);

  const [generatedText, setGeneratedText] = useState("");


  const [loading, setLoading] = useState(false);
  const coverImage = useCoverImage();

  const handleGeneratedText = () => {;
    setGeneratedText(generatedText);
    onAddContent(generatedText);
  };

  // const handleGeneratedTest = () => {
  //   const newText = generatedText;
  //   setGeneratedText(newText);
  //   onAddContent(newText);
  // };

  const handleAddAudioClick = () => {
    setIsAudioModalOpen(true);
  };


  const handleAudioFileSelect = (files: FileList) => {
    if (files && files.length > 0) {
      const file = files[0]; // Select the first file
      setAudioFile(file);
    }
    // sent file to route
  };


  const onUploadClick = async () => {
    if (!audioFile) return;

    // Set loading state to true
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", audioFile);

      const response = await fetch("/api/uploadAudio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload audio file");
      }

      const data = await response.json();

      console.log(data);

      // Assuming the response contains the transcription text
      const transcriptionText = data.text;

      setGeneratedText(transcriptionText);

      // const htmlText = transcriptionText;

      // // Set the generated text
      // if (typeof htmlText === "string") {
      //   setGeneratedText(htmlText);
      // } else {
      //   const resolvedHtmlText = await htmlText;
      //   setGeneratedText(resolvedHtmlText);
      // }
    } catch (error) {
      console.error("Error uploading/transcribing audio file:", error);
    } finally {
      // Clear loading state regardless of success or failure
      setLoading(false);
    }
  };



  // handle Summarize text

  const closeAudioModal = () => {
    setIsAudioModalOpen(false);
    setAudioFile(null);
    setGeneratedText("");
  };

  // const closeLatexModal = () => {
  //   setIsLatexModalOpen(false);
  //   setLatexImage(null);
  //   setGeneratedLatex("");
  // };


  const enableInput = () => {
    if (preview) return;

    setIsEditing(true);

    setTimeout(() => {
      setValue(initialData.title);
      inputRef.current?.focus();
    }, 0);
  };

  const disableInput = () => setIsEditing(false);

  const onInput = (value: string) => {
    setValue(value);
    update({
      id: initialData._id,
      title: value || "Untitled",
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      disableInput();
    }
  };

  const onIconSelect = (icon: string) => {
    update({
      id: initialData._id,
      icon,
    });
  };

  const onIconRemove = () => {
    removeIcon({
      id: initialData._id,
    });
  };

  // how to this
  const fileTypes = ["MP3"];

  return (
    <div className="group relative pl-[54px]">
      {/* <ParentComponent /> */}
      {!!initialData.icon && !preview && (
        <div className="group/icon flex items-center gap-x-2 pt-6">
          <IconPicker onChange={onIconSelect}>
            <p className="text-6xl transition hover:opacity-75">
              {initialData.icon}
            </p>
          </IconPicker>
          <Button
            onClick={onIconRemove}
            className="rounded-full text-xs text-muted-foreground opacity-0 transition group-hover/icon:opacity-100"
            variant="outline"
            size="icon"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
      {!!initialData.icon && preview && (
        <p className="pt-6 text-6xl">{initialData.icon}</p>
      )}

      <div className="flex items-center gap-x-1 py-4 opacity-100 group-hover:opacity-100">
        {!initialData.icon && !preview && (
          <IconPicker asChild onChange={onIconSelect}>
            <Button
              className="text-xs text-muted-foreground"
              variant="outline"
              size="sm"
            >
              <Smile className="mr-2 size-4" />
              Add icon
            </Button>
          </IconPicker>
        )}
        {!initialData.coverImage && !preview && (
          <Button
            className="text-xs text-muted-foreground"
            variant="outline"
            size="sm"
            onClick={coverImage.onOpen}
          >
            <ImageIcon className="mr-2 size-4" />
            Add cover
          </Button>
        )}
        {/* Add new "Add Audio" button */}
        {!initialData.audio && !preview && (
          <Button
            className="text-xs text-muted-foreground"
            variant="outline"
            size="sm"
            onClick={handleAddAudioClick} // Add a new function to handle audio selection
          >
            <FileAudio className="mr-2 size-4" />
            Add audio
          </Button>
        )}
        
        <Modal
          isOpen={isAudioModalOpen}
          onRequestClose={closeAudioModal}
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
              handleChange={handleAudioFileSelect}
              name="file"
              types={fileTypes}
            />
            <p>
              {audioFile
                ? `File name: ${audioFile.name}`
                : "no files uploaded yet"}
            </p>
          </div>

          {/* <input type="file" onChange={handleAudioFileSelect} /> */}

          <div className="mt-4 flex justify-end">
            <Button
              className="text-xs text-muted-foreground"
              variant="outline"
              size="sm"
              onClick={onUploadClick}
            >
              Generate
            </Button>
            <Button
              className="ml-2 text-xs text-muted-foreground"
              variant="outline"
              size="sm"
              onClick={closeAudioModal}
            >
              Cancel
            </Button>
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            generatedText && (
              <div className="mt-4">
                <h3>Generated Text:</h3>
                <p>{generatedText}</p>
                <Button
                  className="mt-2 text-xs text-muted-foreground"
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratedText}
                >
                  Add to Editor
                </Button>
              </div>
            )
          )}
        </Modal>

      </div>
      {isEditing && !preview ? (
        <div>
          <TextareaAutosize
            ref={inputRef}
            onBlur={disableInput}
            onKeyDown={onKeyDown}
            value={value}
            onChange={(e) => onInput(e.target.value)}
            className="resize-none break-words bg-transparent text-5xl font-bold text-[#3F3F3F] outline-none dark:text-[#CFCFCF]"
          />
        </div>
      ) : (
        <div
          onClick={enableInput}
          className="break-words pb-[11.5px] text-5xl font-bold text-[#3F3F3F] outline-none dark:text-[#CFCFCF]"
        >
          {initialData.title}
        </div>
      )}
    </div>
  );
};
