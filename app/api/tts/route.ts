import { NextRequest, NextResponse } from "next/server";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import fs from "fs";
import path from "path";
import util from "util";
import { franc } from "franc";

// Create a client
const client = new TextToSpeechClient({
  keyFilename: path.join(
    process.cwd(),
    "future-sunrise-424210-u6-545e79acda11.json"
  ), // Update this path
});

export const POST = async (req: NextRequest, res: NextResponse) => {
  try {
    const data = await req.json();
    const text = data.text;
    console.log(text);

    if (!text) {
      return NextResponse.json(
        { message: "Text is required" },
        { status: 400 }
      );
    }

    // Detect language
    const lang = franc(text, { minLength: 3 });

    let languageCode = "en-US";
    let ssmlGender = "JOURNEY";
    let voiceName = "en-US-Journey-F";

    if (lang === "kor") {
      languageCode = "ko-KR";
      ssmlGender = "NEUTRAL";
      voiceName = "ko-KR-Wavenet-A";
    } else if (lang === "eng") {
      languageCode = "en-US";
      ssmlGender = "JOURNEY";
      voiceName = "en-US-Journey-F";
    }

    // Construct the request
    const request = {
      input: { text },
      voice: {
        languageCode,
        ssmlGender,
        name: voiceName,
      },
      audioConfig: { audioEncoding: "MP3" },
    };

    // Performs the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);

    // Generate a unique filename based on timestamp
    const timestamp = new Date().getTime(); // Current timestamp
    const audioFileName = `output_${timestamp}.mp3`;
    const audioFilePath = path.join(process.cwd(), "public/audio", audioFileName);

    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(audioFilePath, response.audioContent, "binary");
    console.log("MP3 file created successfully:", audioFilePath);

    // Generate a URL for the audio file
    const audioUrl = `/audio/${audioFileName}`;

    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error("ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
