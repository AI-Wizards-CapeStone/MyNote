const express = require('express');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
const port = 3001;

const openai = new OpenAI(process.env.OPENAI_API_KEY);

app.use(cors()); // Enable CORS for all routes

const upload = multer({ dest: 'uploads/' });

app.post('/transcribe', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check file format
    const allowedFormats = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm', 'mgeg'];
    const fileExtension = path.extname(file.originalname).substring(1).toLowerCase();
    if (!allowedFormats.includes(fileExtension)) {
      fs.unlinkSync(file.path); // Delete the uploaded file
      return res.status(400).json({ error: `Unrecognized file format. Supported formats: ${allowedFormats.join(', ')}` });
    }
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(file.path),
      model: 'whisper-1',
      response_format: 'text',
    });

    // Delete the uploaded file after transcription
    fs.unlinkSync(file.path);

    res.json({ transcription: transcription.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
