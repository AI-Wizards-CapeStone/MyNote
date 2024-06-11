import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import { GoogleAIFileManager } from "@google/generative-ai/files"; // Replace "path/to/GoogleAIFileManager" with the actual path to the module.
import { GoogleGenerativeAI } from "@google/generative-ai";
import markdownToTxt from "markdown-to-txt";
import path from "path";

export async function POST(req : NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    // Save the file to a temporary location
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const fileName = file.name;
    const filePath = path.join(process.cwd(), "public/uploads", fileName); // Adjust this path if needed
    await fs.writeFile(filePath, buffer);

    const fileURL = path.join("public/uploads", fileName);

    console.log(fileURL);

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""; // Ensure that the API key is defined
    const fileManager = new GoogleAIFileManager(apiKey);
    const uploadResult = await fileManager.uploadFile(fileURL, {
      mimeType: "audio/mp3",
      displayName: "audio",
    });

    console.log(
      `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`
    );

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "",
    });

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      },
      {
        text: `Summarize this audio, the first sentence in header 2 format, main point in numbered list point start with bold text. Use markdown to make document look formal and beautiful.`,
      },
    ]);

    const response = result.response;
    const text = await response.text();
    const plainText = markdownToTxt(text);

    // Call the internal text-to-speech API
    // const baseUrl = `${req.headers.get("origin")}`;
    const ttsResponse = await fetch(`http://localhost:3003/api/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: plainText }),
    });

    if (!ttsResponse.ok) {
      throw new Error("Failed to fetch audio");
    }

    const resultTTS = await ttsResponse.json();

    if (ttsResponse.ok) {
      const timestampedUrl = `${resultTTS.audioUrl}?t=${new Date().getTime()}`;
      return NextResponse.json({ status: "success", text, audioUrl: timestampedUrl });
    } else {
      throw new Error(resultTTS.message || "Something went wrong");
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "fail", error: e.message });
  }
}
