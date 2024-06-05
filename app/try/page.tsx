import Image from "next/image";
import fs from "node:fs/promises";
import UploadForm from "./uploadForm";
import Stackedit from "stackedit-js";
export default async function Home() {
  const files = await fs.readdir("./app/try/uploads");
  const images = files
    .filter((file) => file.endsWith(".*"))
    .map((file) => `/uploads/${file}`);

  const el = document.querySelector("textarea");
  const stackedit = new Stackedit();

  // Open the iframe
  stackedit.openFile({
    name: "Filename", // with an optional filename
    content: {
      text: el.value, // and the Markdown content.
    },
  });

  // Listen to StackEdit events and apply the changes to the textarea.
  stackedit.on("fileChange", (file) => {
    el.value = file.content.text;
  });

  return (
    <main>
      <UploadForm />
    </main>
  );
}
