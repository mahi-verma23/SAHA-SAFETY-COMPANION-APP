from flask import Flask , request , jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

try:
    from voice_detect import anal_audio
    WHISPER_AVAILABLE = True
except Exception as e:
    print(f"Whisper not available: {e}")
    WHISPER_AVAILABLE = False

from chatbot import chat_resp
from smsalert import send_sos


app = Flask(__name__)
CORS(app, origins=["https://saha-safety-companion-app.vercel.app", "http://localhost:8080", "http://localhost:5173"])
@app.route("/health",methods=["GET"])
def health():
    return jsonify({"status":"SAHA BACKEND IS RUNNING!"})


@app.route("/sos", methods=["POST"])
def sos_route():
    data = request.get_json()

    if not data:
        return jsonify({"success":False, "error":"No data provided"}),400
    
    lat = data.get("lat","Unknown")
    lng = data.get("lng","Unknown")
    contact_number = data.get("contact") or os.getenv("EMERGENCY_CONTACT")

    if not contact_number:
        return jsonify({"success":False, "error":"No emergency contact"})
    
    result = send_sos(lat,lng,contact_number)
    return jsonify(result)

#chatbot routing
@app.route("/chat", methods=["POST"])
def chat_route():
    data = request.get_json()

    if not data or "message" not in data:
        return jsonify({"success":False, "error":"no message given"}),400
    
    message = data["message"]
    session_id = data.get("session_id","default")

    result = chat_resp(message,session_id)
    return jsonify(result)

#audio analysis routing
@app.route("/anal-audio",methods=["POST"])
def analyze_aud_route():
    if not WHISPER_AVAILABLE:
        return jsonify({"success": False, "error": "Voice detection not available"}), 503
    
    if "audio" not in request.files:
        return jsonify({"success":False,"error":"no audio file present"}),400
    
    audio_file = request.files["audio"]

    if audio_file.filename == "":
        return jsonify({"success":False,"error":"Empty Filename"}),400
    
    result = anal_audio(audio_file)
    return jsonify(result)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'https://saha-safety-companion-app.vercel.app')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
    
