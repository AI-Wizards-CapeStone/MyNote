"use client";

import React, { ElementRef, useRef, useState, useEffect, Fragment } from "react";
import { useMutation } from "convex/react";
import TextareaAutosize from "react-textarea-autosize";
import { ImageIcon, Smile, X, Pencil, RotateCcw, RotateCw, Eye, EyeOff, FileText, ChevronDown, TableIcon } from "lucide-react";
import { Dialog, Transition } from '@headlessui/react';
import { toPng } from 'html-to-image';

import { Button } from "@/components/ui/button";
import { IconPicker } from "./icon-picker";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useCoverImage } from "@/hooks/use-cover-image";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface ToolbarProps {
  initialData: Doc<"documents">;
  preview?: boolean;
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
      ctx?.beginPath();
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
        ctx.strokeStyle = isEraser ? "white" : brushColor;

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
          disabled={isEraser}
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

export const Toolbar = ({ initialData, preview }: ToolbarProps) => {
  const inputRef = useRef<ElementRef<"textarea">>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialData.title);
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState<boolean>(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableData, setTableData] = useState([[""]]);

  const update = useMutation(api.documents.update);
  const removeIcon = useMutation(api.documents.removeIcon);

  const coverImage = useCoverImage();

  useEffect(() => {
    const savedPdfUrl = localStorage.getItem("savedPdfUrl");
    const savedShowPdf = localStorage.getItem("savedShowPdf") === 'true';
    if (savedPdfUrl) {
      setPdfUrl(savedPdfUrl);
      setShowPdf(savedShowPdf);
    }
  }, []);

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

  const onPdfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const pdfUrl = URL.createObjectURL(file);
      setPdfUrl(pdfUrl);
      setShowPdf(true);
      localStorage.setItem("savedPdfUrl", pdfUrl);
      localStorage.setItem("savedShowPdf", 'true');
    }
  };

  const onPdfRemove = () => {
    setPdfUrl(null);
    setShowPdf(false);
    localStorage.removeItem("savedPdfUrl");
    localStorage.removeItem("savedShowPdf");
  };

  const togglePdfVisibility = () => {
    setShowPdf(!showPdf);
    localStorage.setItem("savedShowPdf", (!showPdf).toString());
  };

  const openTableModal = () => setIsTableModalOpen(true);
  const closeTableModal = () => setIsTableModalOpen(false);

  const handleTableChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...tableData];
    newData[rowIndex][colIndex] = value;
    setTableData(newData);
  };

  const addRow = () => {
    setTableData([...tableData, Array(tableData[0].length).fill("")]);
  };

  const addColumn = () => {
    setTableData(tableData.map(row => [...row, ""]));
  };

  const saveTableAsImage = () => {
    if (tableRef.current === null) return;

    toPng(tableRef.current)
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'table.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((error) => {
        console.error('oops, something went wrong!', error);
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
            <X className="h-4 w-4" />
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
              <Smile className="mr-2 h-4 w-4" />
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
            <ImageIcon className="mr-2 h-4 w-4" />
            Add cover
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
        {!preview && (
          <>
            <input
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={onPdfChange}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="text-xs text-muted-foreground"
                  variant="outline"
                  size="sm"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  PDF
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onSelect={() => fileInputRef.current?.click()}
                >
                  Load PDF
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={togglePdfVisibility}>
                  {showPdf ? "Hide PDF" : "Show PDF"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        <Button
          className="text-xs text-muted-foreground"
          variant="outline"
          size="sm"
          onClick={openTableModal}
        >
          <TableIcon className="mr-2 h-4 w-4" />
          Add Table
        </Button>
      </div>
      {isEditing && !preview ? (
        <TextareaAutosize
          ref={inputRef}
          onBlur={disableInput}
          onKeyDown={onKeyDown}
          value={value}
          onChange={(e) => onInput(e.target.value)}
          className="resize-none break-words bg-transparent text-5xl font-bold text-[#3F3F3F] outline-none dark:text-[#CFCFCF]"
        />
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
      {showPdf && pdfUrl && (
        <div className="mt-4 relative">
          <embed
            src={pdfUrl}
            type="application/pdf"
            width="100%"
            height="600px"
          />
          <Button
            className="absolute top-2 right-2 text-xs text-muted-foreground"
            variant="outline"
            size="sm"
            onClick={onPdfRemove}
          >
            <X className="mr-2 h-4 w-4" />
            Remove PDF
          </Button>
        </div>
      )}
      <Transition appear show={isTableModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeTableModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Add Table
                  </Dialog.Title>
                  <div className="mt-2">
                    <div className="overflow-auto">
                      <table ref={tableRef} className="min-w-full border-collapse">
                        <tbody>
                          {tableData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, colIndex) => (
                                <td key={colIndex} className="border p-2">
                                  <input
                                    type="text"
                                    value={cell}
                                    onChange={(e) => handleTableChange(rowIndex, colIndex, e.target.value)}
                                    className="w-full border-none focus:ring-0"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button onClick={addRow} className="mr-2">Add Row</Button>
                    <Button onClick={addColumn}>Add Column</Button>
                  </div>
                  <div className="mt-4">
                    <Button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={saveTableAsImage}
                    >
                      Confirm and Save
                    </Button>
                    <Button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={closeTableModal}
                    >
                      Close
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};
