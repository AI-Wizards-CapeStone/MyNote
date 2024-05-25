require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/files');
// const { genAI } = require('./utils/common'); // Adjust the import according to your project structure
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3002;

// app.use(express.static('public'));
app.use(cors());


app.post('/upload', upload.single('file'), async (req, res) => {
  console.log("Hi from server");
  try {
    const filePath = req.file.path;
    const fileManager = new GoogleAIFileManager(process.env.API_KEY);
    
    const fileResult = await fileManager.uploadFile(filePath, {
      mimeType: req.file.mimetype,
      displayName: "audio",
    });


    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: "Summarize this audio, main point in bullet point, Write in korean language" },
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
    console.error('Error:', error);
    res.status(500).send('An error occurred');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
