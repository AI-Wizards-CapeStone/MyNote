import { NextRequest, NextResponse } from "next/server";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import fs from "fs";
import path from "path";
import util from "util";
import { json } from "stream/consumers";
import test from "node:test";

const db = require("better-sqlite3")(
  path.join(process.cwd(), "mydatabases.db")
);

// Create a client
const client = new TextToSpeechClient({
  keyFilename: path.join(
    process.cwd(),
    "future-sunrise-424210-u6-545e79acda11.json"
  ), // Update this path
});

const row = db
  .prepare("SELECT * FROM plaintext_data ORDER BY id DESC LIMIT 1")
  .get();
console.log(row.markdown);

export const POST = async (req: NextRequest) => {
  try {
    const md = row.markdown;
    const text = row.plainText;

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
    const audioContentBase64 = Buffer.from(response.audioContent).toString(
      "base64"
    );

    // Write the binary audio content to a local file
    // const writeFile = util.promisify(fs.writeFile);
    // const audioFileName = path.join(process.cwd(), "output.mp3");
    // await writeFile(audioFileName, response.audioContent, "binary");

    // Read the file and send it as a response
    // const audioBuffer = fs.readFileSync(audioFileName);

    // // Clean up the file after sending the response
    // fs.unlinkSync(audioFileName);

    // const headers = new Headers({
    //   "Content-Type": "audio/mpeg",
    //   "Content-Disposition": "attachment; filename=output.mp3",
    // });

    // return new NextResponse(audioBuffer, { headers });
    return NextResponse.json({
      test,
      audioContent: audioContentBase64,
    });
  } catch (error) {
    console.error("ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
