// Import required modules
import { NextResponse } from 'next/server';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

// Initialize the Google Generative AI with API key from environment variables
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || ' ';
const genAI = new GoogleGenerativeAI(apiKey);

// Set up the generative model
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

// Define generation configuration
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

// Define safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Define the POST request handler
export async function POST(req) {
  try {
    // Parse the incoming JSON request
    const data = await req.json();
    console.log(data);

    // Start a new chat session
    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [],
    });

    // Send the input message to the chat session
    const result = await chatSession.sendMessage(data.input);

    // Return the AI response in JSON format
    return NextResponse.json({ response: result.response.text() });
  } catch (error) {
    // Handle any errors that occur
    console.error('Error handling the POST request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
