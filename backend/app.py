from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
from dotenv import load_dotenv
from flask_openapi import OpenAI

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})   # Enable CORS to allow requests from your frontend

client = OpenAI()

# audio_file = open("/path/to/file/speech.mp3", "rb")
# transcription = client.audio.transcriptions.create(
#   model="whisper-1", 
#   file=audio_file, 
#   response_format="text"
# )

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    audio_file = request.files['file']
    model = "whisper-1"  # Default model is whisper-1

    try:
        # Debugging output
        print(f"Received file: {audio_file.filename}")
        print(f"Using model: {model}")

        # OpenAI client code
        transcription = client.audio.transcriptions.create(
            model="whisper-1", 
            file=audio_file, 
            response_format="text"
        )
        return jsonify({'text': transcription['text']}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
