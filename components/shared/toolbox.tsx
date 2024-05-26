"use client";

import React, { ElementRef, useRef, useState } from "react";
import Modal from "react-modal";
import { useMutation } from "convex/react";
import TextareaAutosize from "react-textarea-autosize";
import { ImageIcon, Smile, X, FileAudio, Moon, Sun, Pencil, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconPicker } from "./icon-picker";

import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

import { useCoverImage } from "@/hooks/use-cover-image";
import { handleAudioUpload } from "./audio-uploader";
import openai from "openai";

import OpenAI from "openai";

import {marked} from "marked";


interface ToolbarProps {
  initialData: Doc<"documents">;
  preview?: boolean;
  onAddContent: (content: string) => void;
}

interface DrawingCanvasProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

const DrawingCanvas = ({ onSave, onCancel }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("black");
  const [isEraser, setIsEraser] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);

  const startDrawing = () => {
    setDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory((prevHistory) => [...prevHistory, imageData]);
        setRedoStack([]);
      }
    }
  };

  const endDrawing = () => {
    setDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.beginPath(); // Reset the path to avoid connecting the last point of previous stroke
    }
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.strokeStyle = isEraser ? "white" : brushColor; // Use white color for eraser

        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
      }
    }
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      onSave(dataUrl);
    }
  };

  const toggleEraser = () => {
    setIsEraser(!isEraser);
  };

  const undo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const previousImageData = history.pop()!;
        setRedoStack((prevRedoStack) => [
          ...prevRedoStack,
          ctx.getImageData(0, 0, canvas.width, canvas.height),
        ]);
        ctx.putImageData(previousImageData, 0, 0);
        setHistory([...history]);
      }
    }
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const nextImageData = redoStack.pop()!;
        setHistory((prevHistory) => [
          ...prevHistory,
          ctx.getImageData(0, 0, canvas.width, canvas.height),
        ]);
        ctx.putImageData(nextImageData, 0, 0);
        setRedoStack([...redoStack]);
      }
    }
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width="500"
        height="500"
        style={{ border: "1px solid black", backgroundColor: "white" }}
        onMouseDown={startDrawing}
        onMouseUp={endDrawing}
        onMouseMove={draw}
      />
      <div style={{ marginTop: "10px" }}>
        <label htmlFor="brushColor">Choose Brush Color: </label>
        <input
          type="color"
          id="brushColor"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
          disabled={isEraser} // Disable color picker when eraser is active
        />
        <Button onClick={toggleEraser} style={{ marginLeft: "10px" }}>
          {isEraser ? "Switch to Brush" : "Switch to Eraser"}
        </Button>
      </div>
      <div style={{ marginTop: "10px" }}>
        <label htmlFor="brushSize">Choose Brush Size: </label>
        <input
          type="range"
          id="brushSize"
          min="1"
          max="50"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
        />
        <span>{brushSize}px</span>
      </div>
      <div style={{ marginTop: "10px" }}>
        <Button onClick={undo} style={{ marginRight: "10px" }}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Undo
        </Button>
        <Button onClick={redo} style={{ marginRight: "10px" }}>
          <RotateCw className="mr-2 h-4 w-4" />
          Redo
        </Button>
        <Button onClick={saveDrawing} style={{ marginRight: "10px" }}>
          Save
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
};

export const Toolbar = ({
  initialData,
  preview,
  onAddContent,
}: ToolbarProps) => {
  const inputRef = useRef<ElementRef<"textarea">>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialData.title);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const update = useMutation(api.documents.update);
  const removeIcon = useMutation(api.documents.removeIcon);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [summarizeText, setSummarizeText] = useState("");

  const coverImage = useCoverImage();

  const handleGeneratedText = () => {
    const newText = generatedText;
    setGeneratedText(newText);
    onAddContent(newText);
  };

  const handleAddAudioClick = () => {
    setIsAudioModalOpen(true);
  };

  const handleAudioFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0]) {
      setAudioFile(event.target.files[0]);
    }
  };

  const onUploadClick = async () => {
    if (!audioFile) return;
  
    // Set loading state to true
    setLoading(true);
  
    try {
      const formData = new FormData();
      formData.append("file", audioFile);
  
      const response = await fetch("http://localhost:3002/upload", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error("Failed to upload audio file");
      }

      const data = await response.json();

      // Assuming the response contains the transcription text
      const transcriptionText = data.text;

      const htmlText = marked(transcriptionText);

      // Set the generated text
      if (typeof htmlText === 'string') {
        setGeneratedText(htmlText);
      } else {
        const resolvedHtmlText = await htmlText;
        setGeneratedText(resolvedHtmlText);
      }
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

  const onSaveDrawing = (dataUrl: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "drawing.png";
    link.click();
    setShowDrawingCanvas(false);
  };

  const onCancelDrawing = () => {
    setShowDrawingCanvas(false);
  };

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
        <Button
          className="text-xs text-muted-foreground"
          variant="outline"
          size="sm"
          onClick={() => setShowDrawingCanvas(true)}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Draw
        </Button>
        <Modal
          isOpen={isAudioModalOpen}
          onRequestClose={closeAudioModal}
          ariaHideApp={false}
          style={{
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
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
            },
          }}
        >
          {/* <h2>Hello</h2> */}
          <input type="file" onChange={handleAudioFileSelect} />

          <div className="mt-4 flex justify-end">
            <Button
              className="text-xs text-muted-foreground"
              variant="outline"
              size="sm"
              onClick={onUploadClick}
            >
              Upload
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
      {showDrawingCanvas && (
        <DrawingCanvas onSave={onSaveDrawing} onCancel={onCancelDrawing} />
      )}
    </div>
  );
};
