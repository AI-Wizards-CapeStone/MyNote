import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import { GoogleAIFileManager } from "@google/generative-ai/files"; // Replace "path/to/GoogleAIFileManager" with the actual path to the module.
import { GoogleGenerativeAI } from "@google/generative-ai";
import markdownToTxt from "markdown-to-txt";
import path from "path";
import os from "os";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";


export async function POST(req: NextRequest): Promise<NextResponse> {
  try {

    // fire base


const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
    const tempDir = os.tmpdir();
    const formData = await req.formData();
    const file = formData.get("file");
    const language = formData.get("language");

    if (!(file instanceof Blob)) {
      throw new Error("Uploaded file is not a valid Blob");
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const fileName = file.name;
    // const filePath = path.join(process.cwd(), "public/uploads", fileName);
    const filePath = path.join(tempDir, fileName);
    await fs.writeFile(filePath, buffer);

    const fileURL = path.join("public/uploads", fileName);
    console.log(fileURL);

    const apiKey = process.env.API_KEY || "";
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
      model: "gemini-1.5-pro",
      systemInstruction: "generate markdown content exclusively",
    });

    const isKorean = language === "Korean";

    const textValue = isKorean
      ? `이 오디오를 요약하면, 헤더 2 형식의 첫 문장, 번호가 매겨진 목록 포인트의 주요 지점은 굵은 텍스트로 시작합니다. 마크다운 포맷만 사용하여 문서를 구성하고, 한국어로 변환합니다.`
      : `Summarize this audio, the first sentence in header 2 format, main point in bullet point start with bold text. Use only markdown format to structure the document and make it look formal and beautiful.`;

    const result = await model.generateContent([
    // `generate markdown content exclusively + ${textValue}`,
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      },
      {
        text: textValue,
      },
    ]);

    const response = result.response;
    const text = await response.text();

    // console.log(t/ext);

    const plainText = markdownToTxt(text);

    await fileManager.deleteFile(uploadResult.file.name);
    console.log(`Deleted ${uploadResult.file.displayName}`);

    return NextResponse.json({ status: "success", text: text });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ status: "fail", error: e.message });
  }
}

