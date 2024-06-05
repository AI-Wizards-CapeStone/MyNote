import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "node:fs/promises";
import { FileState, GoogleAIFileManager } from "@google/generative-ai/files"; // Replace "path/to/GoogleAIFileManager" with the actual path to the module.
import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { response } from "express";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

async function uploadToGemini(path: string, mimeType: string) {
  const uploadResult = await fileManager.uploadFile(path, {
    mimeType,
    displayName: path,
  });
  const file = uploadResult.file;
  console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
  return file;
}

//Waiting file tobe ready
async function waitForFilesActive(files: any[]) {
  console.log("Waiting for file processing...");
  for (const name of files.map((file: any) => file.name)) {
    let file = await fileManager.getFile(name);
    while (file.state === "PROCESSING") {
      process.stdout.write(".");
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      file = await fileManager.getFile(name);
    }
    if (file.state !== "ACTIVE") {
      throw Error(`File ${file.name} failed to process`);
    }
  }
  console.log("...all files ready\n");
}

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  systemInstruction:
    "Identify the most relevant and interesting sections of this document and compile them into a concise summary. Create a bullet point list of the key points from this document and organize them into a coherent summary.",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
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
    const fileURL = `app/try/uploads/${fileName}`; // Adjust this URL based on your application setup

    const files = [await uploadToGemini(fileURL, "application/pdf")];

    // Some files have a processing delay. Wait for them to be ready.
    await waitForFilesActive(files);

    // Initialize the generative model with a model that supports multimodal input.
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: "Identify the most relevant and interesting sections of this document and compile them into a concise summary. Create a bullet point list of the key points from this document and organize them into a coherent summary.",
    });

    // Generate content using text and the URI reference for the uploaded file.
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: files[0].mimeType,
          fileUri: files[0].uri,
        },
      },
      {
        text: "Describe the image with to easier to understand and Detail. The main point highligh with bullet point.",
      },
    ]);

    const response = result.response;
    const text = await response.text();

    console.log(text);

    if (files[0].displayName) {
      await fileManager.deleteFile(files[0].displayName);
      console.log(`Deleted ${files[0].displayName}`);
    }

    revalidatePath("/try");

    // Return the file URL in the response
    return NextResponse.json({ status: "success", text });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "fail", error: e });
  }
}
