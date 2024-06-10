import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { GoogleAIFileManager } from "@google/generative-ai/files"; // Replace "path/to/GoogleAIFileManager" with the actual path to the module.
import { GoogleGenerativeAI } from "@google/generative-ai";
import markdownToTxt from 'markdown-to-txt';
import path from "path";
import { marked } from "marked";

const markdownToPlainText = (markdown: string) => {
  return marked(markdown, { renderer: new marked.Renderer() });
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    // Save the file to a temporary location
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const fileName = file.name;
    const filePath = `./app/try/uploads/${fileName}`;
    await fs.writeFile(filePath, buffer);

    // console.log(filePath);

    // Get the URL of the saved file
    const fileURL = `app/try/uploads/${fileName}`; // Adjust this URL based on your application setup

    console.log(fileURL);

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""; // Ensure that the API key is defined
    const fileManager = new GoogleAIFileManager(apiKey);
    const uploadResult = await fileManager.uploadFile(fileURL, {
      mimeType: "audio/mp3",
      displayName: "audio",
    });

    // /home/dev/project/nextjs14-notion/app/try/uploads/img178.png
    // app/try/uploads/img178.png
    console.log(
      `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`
    );

    // ====================================================================================

    // Get a file's metadata.
    const getResult = await fileManager.getFile(uploadResult.file.name);

    // View the response.
    console.log(`Retrieved file ${getResult.displayName} as ${getResult.uri}`);
    // Perform any further actions if needed, such as revalidating cache

    const genAI = new GoogleGenerativeAI(apiKey);

    // Initialize the generative model with a model that supports multimodal input.
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: "",
    });

    // Generate content using text and the URI reference for the uploaded file.
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      },
      {
        text: `Summarize this audio, the first sentent in header 2 format, main point in bullet point start with bold text. Use markdown to make document look formal and beautiful.`,
      },
    ]);

    const response = result.response;
    const text = await response.text();

    // console.log(text);

    // ======================================================= sqlite

    // Initialize SQLite database
    // const dbPath = path.join(process.cwd(), "mydatabase.db");
    const db = require("better-sqlite3")(
      path.join(process.cwd(), "mydatabases.db")
    );

    // Create plaintext_data table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS plaintext_data (
        id INTEGER PRIMARY KEY,
        markdown TEXT NOT NULL,
        plainText TEXT NOT NULL
      );
    `);

    const plainText = markdownToTxt(text);
    const rawData = db.prepare(
      "INSERT INTO plaintext_data (markdown, plainText) VALUES (?, ?)"
    );
    rawData.run(text, plainText);

    // console.log(plainText);

    // console.log(test);

    await fileManager.deleteFile(uploadResult.file.name);

    console.log(`Deleted ${uploadResult.file.displayName}`);

    // revalidatePath("/try");
    // const rows = db.prepare("SELECT * FROM plaintext_data").all();
    // console.log(rows);

    // Return the file URL in the response
    return NextResponse.json({ status: "success", text });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "fail", error: e });
  }
}
