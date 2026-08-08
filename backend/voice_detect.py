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

def analyze_tone(path):
    try:
        a,sr = librosa.load(path,sr=None)

        energy=float(np.mean(librosa.feature.rms(y=a)))
        pitches,magnitudes=librosa.piptrack(y=a,sr=sr)
        pitch=float(np.mean(pitches[pitches>0]))if np.any(pitches>0) else 0.0
        tempo_arr = librosa.beat.beat_track(y=a, sr=sr)
        tempo = float(np.squeeze(tempo_arr[0]))

        if energy > 0.05 and pitch > 200:
            tone = "panic"
        elif energy > 0.02 or pitch > 150:
            tone = "distress"
        else:
            tone = "calm"
        return {
                "tone": tone,
                "energy": round(energy, 4),
                "pitch": round(pitch, 2),
                "tempo": round(tempo, 2)
            }

    except Exception as e:
        return {
            "tone": "unknown",
            "error": str(e)
        }



def anal_audio(audio_file):
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

        tone_result = analyze_tone(temp_path)
        overall_distress = is_distress or tone_result.get("tone") in ["panic", "distress"]

        return {
            "success":True,
            "transcript":transcp,
            "language":detected_lang,
            "distress_detected":found_keywords,
            "tone_analysis": tone_result,
            "distress_detected": overall_distress
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

