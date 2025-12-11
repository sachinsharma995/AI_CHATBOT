# app.py - Simple Python Flask Backend for Chatbot

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json

# Initialize Flask App
app = Flask(__name__)
# CORS enabled for development (allows JavaScript frontend to talk to this backend)
CORS(app) 

# --- Configuration ---
# NOTE: Replace 'YOUR_GEMINI_API_KEY_HERE' with your actual key in a real application, 
# or use environment variables (best practice).
# For this example, we assume the key is passed from the environment or is a placeholder.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyD_nDHcfo9PxBSBx18-YTF0mdP2ijcIQcI")
GEMINI_MODEL_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key={GEMINI_API_KEY}"

SYSTEM_INSTRUCTION = "You are a friendly and helpful AI Assistant. You should respond directly and concisely to user queries. Keep your responses to 2-3 sentences max. Use clear and encouraging language."

@app.route('/chat', methods=['POST'])
def chat():
    # 1. Frontend se data receive karna
    data = request.json
    user_message = data.get('message')
    chat_history = data.get('history', [])

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    # 2. Gemini API ke liye payload taiyar karna
    # Chat history mein naya user message add karna
    chat_history.append({"role": "user", "parts": [{"text": user_message}]})

    gemini_payload = {
        "contents": chat_history,
        "systemInstruction": {
            "parts": [{"text": SYSTEM_INSTRUCTION}]
        }
    }

    # 3. Gemini API ko request bhejna
    try:
        response = requests.post(
            GEMINI_MODEL_URL,
            headers={'Content-Type': 'application/json'},
            data=json.dumps(gemini_payload)
        )
        response.raise_for_status() # HTTP errors ke liye exception raise karna
        
        gemini_result = response.json()
        
        # 4. Response se text extract karna
        bot_text = gemini_result.get('candidates')[0]['content']['parts'][0]['text'] if gemini_result.get('candidates') else "I apologize, I received an unclear response from the AI."

        # 5. Frontend ko jawab wapas bhejna
        return jsonify({"response": bot_text}), 200

    except requests.exceptions.RequestException as e:
        print(f"Error calling Gemini API: {e}")
        return jsonify({"error": "Failed to communicate with AI model."}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected server error occurred."}), 500


# Server run karne ke liye
if __name__ == '__main__':
    # Flask server ko 5000 port par run karna (default port)
    print("Flask server running on http://127.0.0.1:5000/chat")
    # Aapko is command ko apne terminal mein run karna hoga: python app.py
    app.run(debug=True, port=5000)





