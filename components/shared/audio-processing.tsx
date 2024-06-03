// audio-processing.tsx

import React, { useState } from "react";
import Modal from "react-modal";
import { useMutation } from "convex/react";
import { FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";

import { api } from "@/convex/_generated/api";

interface AudioProcessingProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

export const AudioProcessing = ({
  isOpen,
  onClose,
  onUpload,
}: AudioProcessingProps) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAudioFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAudioFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!audioFile) return;
    setLoading(true);

    try {
      await onUpload(audioFile);
    } catch (error) {
      console.error("Error uploading/transcribing audio file:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
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
          width: "600px",
          height: "400px",
        },
      }}
    >
      <input type="file" onChange={handleAudioFileSelect} />
      <div className="mt-4 flex justify-end">
        <Button
          className="text-xs text-muted-foreground"
          variant="outline"
          size="sm"
          onClick={handleUpload}
        >
          Upload
        </Button>
        <Button
          className="ml-2 text-xs text-muted-foreground"
          variant="outline"
          size="sm"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
      {loading && <div>Loading...</div>}
    </Modal>
  );
};
