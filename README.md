# SAHA — Women's Safety Companion

An AI-powered women's safety app with real-time emergency response, multilingual support, and smart alert systems.

**Features**

-1. 🆘 **SOS Button**

Press and hold for 3 seconds to send emergency SMS with live location to all contacts
Turn on flashlight
Trigger loud siren
Start automatic voice recording
Start camera recording (if possible)

- 2. 🎙️ **Voice Distress Detection** — Whisper AI transcribes audio and detects distress keywords in 10+ Indian languages and foreign languages too.
Continuously listen (if permission given)
Detect keywords like:
“Help”, “Bachao”, “Bacho”, “Save me”, “Mujhe bachao”
Support Indian languages:
Hindi, Marathi, Bengali, Tamil, Telugu, Malayalam, Gujarati, Punjabi, Kannada, Odia, Assamese
When detected:
Trigger SOS actions automatically

- 3. 🔊 **Tone Analysis** — librosa analyzes pitch, energy and tempo to detect panic even without keywords


- 4. 🤖 **Multilingual AI Chatbot** — Responds in the user's language with safety advice, legal guidance.

Chatbot gives mental health support

App drafts a police report

- 5. 📍 **Live Location Sharing** — Google Maps link sent automatically with every SOS alert

- 6. 🔦 **Safety Tools** — Flashlight, siren, fake call, audio/video recording

- 7. **Auto-Safety Triggers**

When battery < 5% → auto-send location

When offline/no internet → SMS instead

## Tech Stack
Frontend: HTML5, CSS3, JavaScript

Backend: Python (Flask) 

Database:  Supabase (auth + data storage)

AI/Services: Whisper, Twilio, Google Maps,Groq LLM (multilingual chatbot),librosa (tone analysis)

Device APIs: Geolocation, MediaRecorder, Flashlight, Battery Status, Geolocation, Haptics

## Built With ❤️ for Women's Safety


