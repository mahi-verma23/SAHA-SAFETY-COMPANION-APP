from flask import Flask , request , jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

from voice_detect import anal_audio
from chatbot import chat_resp
from smsalert import send_sos


app = Flask(__name__)
CORS(app)

@app.route("/health",methods=["GET"])
def health():
    return jsonify({"status":"SAHA BACKEND IS RUNNING!"})


@app.route("/sos", methods=["POST"])
def sos_route():
    data= request.get_json()

    if not data:
        return jsonify({"success":False, "error":"No data provided"}),400
    
    lat = data.get("lat","Unknown")
    lng = data.get("lng","Unknown")
    contact_number = data.get("contact") or os.getenv("EMERGENY_CONTACT")

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
    if "audio" not in request.files:
        return jsonify({"success":False,"error":"no audio file present"}),400
    
    audio_file = request.files["audio"]

    if audio_file.filename == "":
        return jsonify({"success":False,"error":"Empty Filename"}),400
    
    result = anal_audio(audio_file)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True,port=5000)
    
