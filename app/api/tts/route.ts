import { NextRequest, NextResponse } from "next/server";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import fs from "fs";
import path from "path";
import util from "util";
import { JSONParser } from "formidable/parsers";

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

    // Construct the request
    const request = {
      input: { text },
      voice: {
        languageCode: "en-US",
        ssmlGender: "CASUAL",
        name: "en-US-Casual-K",
      },
      audioConfig: { audioEncoding: "MP3" },
    };

    // Performs the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);

    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    const audioFileName = path.join(process.cwd(), "public/audio/output.mp3");
    try {
      await writeFile(audioFileName, response.audioContent, "binary");
      console.log("MP3 file created successfully:", audioFileName);
    } catch (error) {
      console.error("Error creating MP3 file:", error);
    }
    // await writeFile(audioFileName, response.audioContent, "binary");

    // Generate a URL for the audio file
    const audioUrl = `/audio/output.mp3`;

    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error("ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
