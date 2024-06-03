"use client"

import React, { useState } from 'react';

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/uploadAndSummarize', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.summary);
      setError('');
    } catch (err) {
      setError('An error occurred while uploading the file.');
      console.error('Error:', err);
    }
  };

  return (
    <div>
      <h1>Upload and Summarize Audio</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="audio/*" onChange={handleFileChange} />
        <button type="submit">Upload and Summarize</button>
      </form>
      {response && (
              <div>
                  Hi
          <h2>Summary:</h2>
          <p>{response}</p>
        </div>
      )}
      {error && (
        <div>
          <p style={{ color: 'red' }}>{error}</p>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
