import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({apiKey: process.env.REACT_APP_OPENAI_API_KEY});

interface HandleAudioUploadProps {
  audioFile: File | null;
  setGeneratedText: React.Dispatch<React.SetStateAction<string>>;
  setIsAudioModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setAudioFile: React.Dispatch<React.SetStateAction<File | null>>;
}

export const handleAudioUpload = async ({
  audioFile,
  setGeneratedText,
  setIsAudioModalOpen,
  setAudioFile,
}: HandleAudioUploadProps) => {
  if (audioFile) {
    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1'); // specify the model you are using

      // Debugging output
      console.log('Uploading file:', audioFile);
      console.log('FormData:', formData);

      // Call OpenAI API to create transcription
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'text',
      });

      console.log('Response from backend:', transcription.text);
      setGeneratedText(transcription.text);
      setIsAudioModalOpen(false);
      setAudioFile(null);
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(
          'Error uploading audio file:',
          error.response ? error.response.data : error.message
        );
      } else {
        console.error('Error:', error);
      }
    }
  }
};

const AudioTranscription: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isAudioModalOpen, setIsAudioModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setIsAudioModalOpen(true);
    }
  };

  const handleAudioUploadClick = async () => {
    if (audioFile) {
      try {
        await handleAudioUpload({
          audioFile,
          setGeneratedText,
          setIsAudioModalOpen,
          setAudioFile,
        });
      } catch (error) {
        setError('An error occurred during the transcription process.');
      }
    }
  };

  return (
    <div>
      <h1>Audio Transcription</h1>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <button onClick={handleAudioUploadClick} disabled={!audioFile}>
        Upload and Transcribe
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {generatedText && (
        <div>
          <h2>Transcription</h2>
          <p>{generatedText}</p>
        </div>
      )}
    </div>
  );
};

export default AudioTranscription;
