import whisper
import tempfile
import os
import numpy as np
import speech_recognition as sr
import librosa 

model = None

def load_m():
    global model
    if model is None:
        print("Loading whisper model...")
        model = whisper.load_model("base")
        print("whisper ready")

    return model

imp_words = [
    "help", "save me", "emergency", "danger", "stop", "let me go",

    "bachao", "madad", "mujhe bachao", "chhodo", "koi hai", "बचाओ","मदद",

    "help cheyyi", "rakshimcu", "aapu", #telugu

    "kaapadu", "udavi", "vidunga", #tamil

    "chere dao", "sahajya koro",#bengali

    "bachva", "madad kara", "sod",#marathi

    "help maadi", "bidisiri", #kannada

    "bachao", "madad karo", #gujarati

]

def anal_audio():
    temp_path = None
    
    try:
        m = load_m()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp:
            audio_file.save(temp.name)
            temp_path=temp.name

        result = m.transcribe(temp_path)
        transcp=result["text"]
        transcp_lower = transcp.lower()
        detected_lang = result.get("language","unknown")

        found_keywords = [k for k in imp_words if k in transcp_lower]
        is_distress = len(found_keywords)>0

        return {
            "success":True,
            "transcript":transcp,
            "language":detected_lang,
            "distress_detected":found_keywords
        }
    except Exception as e:
        return{
            "success":False,
            "error":str(e),
            "distress_detected":False
        }
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

            