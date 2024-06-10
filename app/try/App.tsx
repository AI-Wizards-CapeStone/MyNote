"use client";
import { Block, BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect, useState } from "react";
import "react-h5-audio-player/lib/styles.css";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";

const App = () => {
  const [text, setText] = useState("");
  const [audioSrc, setAudioSrc] = useState("");
  const [responseText, setResponseText] = useState("");
  // const [initialContent, setInitialContent] = useState<
  //   PartialBlock[] | undefined | "loading"
  // >("loading");

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch audio");
      }

      const result = await response.json();

      setResponseText(result.text);
      const audioBlob = new Blob([Buffer.from(result.audioContent, "base64")], {
        type: "audio/mpeg",
      });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioSrc(audioUrl);
    } catch (error) {
      console.error(error);
    }
  };

  // async function saveToStorage(jsonBlocks: Block[]) {
  //   // Save contents to local storage. You might want to debounce this or replace
  //   // with a call to your API / database.
  //   localStorage.setItem("editorContent", JSON.stringify(jsonBlocks));
  // }

  // async function loadFromStorage() {
  //   // Gets the previously stored editor contents.
  //   const storageString = localStorage.getItem("editorContent");
  //   return storageString
  //     ? (JSON.parse(storageString) as PartialBlock[])
  //     : undefined;
  // }

  // type BlockIdentifier = string | Block;

  const editor = useCreateBlockNote();

  console.log(responseText)

  const onClick = async () => {
    const BlockIdentifier = editor.document[editor.document.length - 1];
    const blocksFromMarkdown =
      await editor.tryParseMarkdownToBlocks(responseText);

    // editor.insertBlocks(blocksFromMarkdown, BlockIdentifier, "before");

    

    editor.replaceBlocks(BlockIdentifier, blocksFromMarkdown);
  };

  useEffect(() => {
    if (!audioSrc) return;
    onClick();
  }, [audioSrc]);

  return (
    <div>
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Enter text here"
      />
      <button onClick={handleSubmit}>Convert to Speech</button>
      {/* {audioSrc && <audio controls src={audioSrc} />} */}
      {audioSrc}
      <BlockNoteView editor={editor} theme={"light"} />
    </div>
  );
};

export default App;
