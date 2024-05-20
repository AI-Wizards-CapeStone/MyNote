import axios from 'axios';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

export const openaiSpeechToText = async (audioFile: File) => {
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model', 'whisper-1'); // or the specific model you are using

  try {
    const response = await axios.post(OPENAI_API_URL, formData, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error with OpenAI API request:', error);
    throw error;
  }
};
