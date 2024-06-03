require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/files");

const app = express();
const PORT = process.env.PORT || 3099;

app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies
app.use(express.static("public"));
app.use(cors());

// Multer storage configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Initialize GoogleGenerativeAI with your API key
const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Get the generative model from GoogleGenerativeAI
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// Generation configuration and safety settings
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const safetySettings = [];

// Endpoint to generate text based on prompt
// app.post("/api/generateText", async (req, res) => {
//   const { prompt } = req.body;

//   if (!prompt) {
//     return res.status(400).json({ error: "Prompt is required" });
//   }

//   try {
//     const chatSession = model.startChat({
//       generationConfig,
//       safetySettings,
//       history: [
//         {
//           role: "user",
//           parts: [{ text: prompt }],
//         },
//       ],
//     });

//     const result = await chatSession.sendMessage(prompt);
//     const generatedText = await result.response.text();

//     res.status(200).json({ generatedText });
//   } catch (error) {
//     console.error("Error generating text:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// Endpoint to upload files
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// Endpoint to upload and summarize audio
app.post("/upload", upload.single("file"), async (req, res) => {
  console.log("Hi from server");
  try {
    const filePath = req.file.path;
    const fileManager = new GoogleAIFileManager(apiKey);

    const fileResult = await fileManager.uploadFile(filePath, {
      mimeType: req.file.mimetype,
      displayName: "audio",
    });

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Summarize this audio, main point in bullet point, Write in Korean language",
            },
            {
              fileData: {
                mimeType: fileResult.file.mimeType,
                fileUri: fileResult.file.uri,
              },
            },
          ],
        },
      ],
    });

    const response = result.response;
    const text = await response.text();

    res.send({ text });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred");
  }
});

// Endpoint to upload and process image
app.post("/upload-image", upload.single("file"), async (req, res) => {
  console.log("Image upload received");
  try {
    const filePath = req.file.path;
    // Add any additional processing for the image if needed here

    console.log(filePath)

    res.send({ message: "Image uploaded successfully", filePath: filePath });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while uploading the image");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
