'use client'
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setAudioUrl("");

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (response.ok) {
        // Append a timestamp to force a fresh fetch of the audio file
        const timestampedUrl = `${data.audioUrl}?t=${new Date().getTime()}`;
        setAudioUrl(timestampedUrl);
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to generate audio");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.load();
    }
  }, [audioUrl]);

  return (
    <div>
      <h1>Text to Speech</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text here..."
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate Speech"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {audioUrl && (
        <div>
          <h2>Generated Audio</h2>
          <audio controls ref={audioRef}>
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
}
