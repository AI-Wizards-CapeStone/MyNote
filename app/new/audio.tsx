import { useState } from 'react';
import { useRouter } from 'next/router';

const AudioUploader = () => {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an audio file.');
      return;
    }

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await fetch('/api/audio-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      setError('An error occurred while uploading the file.');
    }
  };

  return (
    <div>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {summary && (
        <div>
          <h2>Summary:</h2>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
};

export default AudioUploader;
