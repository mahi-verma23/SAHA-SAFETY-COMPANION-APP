import { useState, useRef, useEffect } from 'react';
import { Mic, Video, Volume2, VolumeX, Phone, Circle, Square , Wrench} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner';

interface SafetyToolsPanelProps {
  onStartFakeCall: () => void;
}

export function SafetyToolsPanel({ onStartFakeCall }: SafetyToolsPanelProps) {
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  const sirenIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const flashStreamRef = useRef<MediaStream | null>(null);
  const flashBlinkRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sirenIntervalRef.current) {
        clearInterval(sirenIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (flashBlinkRef.current) {
        clearInterval(flashBlinkRef.current);
      }
      const overlay = document.getElementById('saha-flash-overlay');
      if (overlay) overlay.remove();
    };
  }, []);

  // Audio Recording
  const toggleAudioRecording = async () => {
    if (isRecordingAudio) {
      audioRecorderRef.current?.stop();
      setIsRecordingAudio(false);
      toast.success('Audio recording saved');
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        audioRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);

    // Convert to base64 for persistent storage
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const recording = {
        id: Date.now().toString(),
        type: 'audio' as const,
        url: base64, // store base64 instead of blob URL
        timestamp: new Date(),
        size: audioBlob.size,
      };

      const existing = JSON.parse(localStorage.getItem('saha_recordings') || '[]');
      existing.push(recording);
      localStorage.setItem('saha_recordings', JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent('newRecording', { detail: recording }));
    };

    stream.getTracks().forEach(track => track.stop());
  };

        mediaRecorder.start();
        setIsRecordingAudio(true);
        toast.success('Audio recording started');
      } catch (error) {
        toast.error('Microphone access denied. Enable permissions in browser settings.');
        console.error('Error accessing microphone:', error);
      }
    }
  };

  // Video Recording
  const toggleVideoRecording = async () => {
    if (isRecordingVideo) {
      videoRecorderRef.current?.stop();
      setIsRecordingVideo(false);
      toast.success('Video recording saved');
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' },
          audio: true 
        });
        const mediaRecorder = new MediaRecorder(stream);
        videoRecorderRef.current = mediaRecorder;
        videoChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            videoChunksRef.current.push(event.data);
          }
        };
        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(videoBlob);
          setVideoUrl(url);

          // Convert to base64 for persistent storage
          const reader = new FileReader();
          reader.readAsDataURL(videoBlob);
          reader.onloadend = () => {
            const base64 = reader.result as string;
            const recording = {
              id: Date.now().toString(),
              type: 'video' as const,
              url: base64, // store base64 instead of blob URL
              timestamp: new Date(),
              size: videoBlob.size,
            };

            const existing = JSON.parse(localStorage.getItem('saha_recordings') || '[]');
            existing.push(recording);
            localStorage.setItem('saha_recordings', JSON.stringify(existing));
            window.dispatchEvent(new CustomEvent('newRecording', { detail: recording }));
          };

          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecordingVideo(true);
        toast.success('Video recording started');
      } catch (error) {
        toast.error('Camera/microphone access denied. Enable permissions in browser settings.');
        console.error('Error accessing camera:', error);
      }
    }
  };

  // Siren
  const toggleSiren = () => {
    if (isSirenActive) {
      if (sirenIntervalRef.current) {
        clearInterval(sirenIntervalRef.current);
        sirenIntervalRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsSirenActive(false);
      toast.success('Siren deactivated');
    } else {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      let frequency = 400;
      let increasing = true;
      
      const playSiren = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.5;
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        
        if (increasing) {
          frequency += 40;
          if (frequency >= 800) increasing = false;
        } else {
          frequency -= 40;
          if (frequency <= 400) increasing = true;
        }
      };

      sirenIntervalRef.current = window.setInterval(playSiren, 100);
      setIsSirenActive(true);
      toast.success('Siren activated');
      
      if (navigator.vibrate) {
        const vibratePattern = () => {
          navigator.vibrate([200, 100]);
        };
        vibratePattern();
        setInterval(vibratePattern, 300);
      }
    }
  };

  const toggleFlashlight = async () => {
  if (isFlashlightOn) {
    // Turn off
    if (flashBlinkRef.current) {
      clearInterval(flashBlinkRef.current);
      flashBlinkRef.current = null;
    }
    if (flashStreamRef.current) {
      const track = flashStreamRef.current.getVideoTracks()[0];
      try {
        await track.applyConstraints({
          advanced: [{ torch: false }] as any
        });
      } catch(err) {
        console.error(err);
      }
      flashStreamRef.current.getTracks().forEach(t => t.stop());
      flashStreamRef.current = null;
    }
    // Remove white screen if exists
    const overlay = document.getElementById('saha-flash-overlay');
    if (overlay) overlay.remove();
    
    setIsFlashlightOn(false);
    toast.success('Flashlight off');
    return;
  }

  // Turn on with blinking
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;

    if (capabilities.torch) {
      // Real torch — blink it
      flashStreamRef.current = stream;
      let torchOn = false;
      flashBlinkRef.current = setInterval(async () => {
        torchOn = !torchOn;
        try {
          await track.applyConstraints({
            advanced: [{ torch: torchOn }] as any
          });
        } catch(err) {
          console.error(err);
        }
      }, 500);
      setIsFlashlightOn(true);
      toast.success('Flashlight blinking');
    } else {
      // No torch — use white screen overlay blinking
      stream.getTracks().forEach(t => t.stop());
      startWhiteScreenBlink();
      setIsFlashlightOn(true);
      toast.success('Screen light activated');
    }
  } catch {
    // Camera denied — use white screen
    startWhiteScreenBlink();
    setIsFlashlightOn(true);
    toast.success('Screen light activated');
  }
};

const startWhiteScreenBlink = () => {
  let visible = false;
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'saha-flash-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: white;
    z-index: 99999;
    pointer-events: none;
    display: none;
  `;
  document.body.appendChild(overlay);

  flashBlinkRef.current = setInterval(() => {
    visible = !visible;
    overlay.style.display = visible ? 'block' : 'none';
  }, 500);
};

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, hsl(340 80% 60%), hsl(280 70% 55%))' }}
        >
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold gradient-text">Safety Tools</h2>
          <p className="text-xs text-muted-foreground">Emergency features</p>
        </div>
      </div>

      {/* Recording Tools */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={toggleAudioRecording}
          className="h-24 rounded-2xl text-white transition-all card-hover flex flex-col items-center justify-center gap-2"
          style={{
            background: isRecordingAudio
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, hsl(340 80% 60%), hsl(340 70% 50%))',
            boxShadow: isRecordingAudio
              ? '0 4px 20px rgba(239, 68, 68, 0.4)'
              : '0 4px 20px rgba(236, 72, 153, 0.3)'
          }}
        >
          {isRecordingAudio ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-6 h-6" />}
          <span className="text-sm font-medium">
            {isRecordingAudio ? 'Stop Recording' : 'Voice Record'}
          </span>
          {isRecordingAudio && <Circle className="w-3 h-3 fill-current animate-pulse" />}
        </button>

        <button
          onClick={toggleVideoRecording}
          className="h-24 rounded-2xl text-white transition-all card-hover flex flex-col items-center justify-center gap-2"
          style={{
            background: isRecordingVideo
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, hsl(280 70% 55%), hsl(280 60% 45%))',
            boxShadow: isRecordingVideo
              ? '0 4px 20px rgba(239, 68, 68, 0.4)'
              : '0 4px 20px rgba(168, 85, 247, 0.3)'
          }}
        >
          {isRecordingVideo ? <Square className="w-6 h-6 fill-current" /> : <Video className="w-6 h-6" />}
          <span className="text-sm font-medium">
            {isRecordingVideo ? 'Stop Recording' : 'Video Record'}
          </span>
          {isRecordingVideo && <Circle className="w-3 h-3 fill-current animate-pulse" />}
        </button>
      </div>

      {/* Siren */}
      <button
        onClick={toggleSiren}
        className="w-full h-20 rounded-2xl text-white transition-all card-hover flex items-center justify-center gap-3"
        style={{
          background: isSirenActive
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : 'linear-gradient(135deg, #f97316, #ea580c)',
          boxShadow: isSirenActive
            ? '0 4px 20px rgba(239, 68, 68, 0.5)'
            : '0 4px 20px rgba(249, 115, 22, 0.3)',
          animation: isSirenActive ? 'pulse 1s infinite' : 'none'
        }}
      >
        {isSirenActive ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        <div className="text-left">
          <p className="font-medium">{isSirenActive ? 'Stop Siren' : 'Emergency Siren'}</p>
          <p className="text-xs opacity-80">{isSirenActive ? 'Siren active...' : 'Loud alarm sound'}</p>
        </div>
      </button>

      {/* Flashlight */}
      <button
        onClick={toggleFlashlight}
        className="w-full h-20 rounded-2xl text-white transition-all card-hover flex items-center justify-center gap-3"
        style={{
          background: isFlashlightOn
            ? 'linear-gradient(135deg, #eab308, #ca8a04)'
            : 'linear-gradient(135deg, #374151, #1f2937)',
          boxShadow: isFlashlightOn
            ? '0 4px 20px rgba(234, 179, 8, 0.4)'
            : '0 4px 20px rgba(0,0,0,0.2)',
          animation: isFlashlightOn ? 'pulse 1s infinite' : 'none'
        }}
      >
        <span className="text-2xl">🔦</span>
        <div className="text-left">
          <p className="font-medium">{isFlashlightOn ? 'Stop Flashlight' : 'Emergency Flashlight'}</p>
          <p className="text-xs opacity-80">{isFlashlightOn ? 'Blinking...' : 'Blinks for distress signal'}</p>
        </div>
      </button>

      {/* Fake Call */}
      <button
        onClick={onStartFakeCall}
        className="w-full h-20 rounded-2xl text-white transition-all card-hover flex items-center justify-center gap-3 btn-gradient"
      >
        <Phone className="w-6 h-6" />
        <div className="text-left">
          <p className="font-medium">Fake Call</p>
          <p className="text-xs opacity-90">Simulate incoming call</p>
        </div>
      </button>

      {/* Recorded Media */}
      {(audioUrl || videoUrl) && (
        <div
          className="p-4 rounded-2xl space-y-3"
          style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(236, 72, 153, 0.15)'
          }}
        >
          <h3 className="text-sm font-semibold gradient-text">Recorded Media</h3>
          {audioUrl && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">🎙️ Audio</p>
              <audio src={audioUrl} controls className="w-full" />
            </div>
          )}
          {videoUrl && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">📹 Video</p>
              <video src={videoUrl} controls className="w-full rounded-xl" />
            </div>
          )}
        </div>
      )}

      <div
        className="p-4 rounded-2xl"
        style={{
          background: 'rgba(236, 72, 153, 0.05)',
          border: '1px solid rgba(236, 72, 153, 0.15)'
        }}
      >
        <p className="text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> Recordings are stored locally for privacy
        </p>
      </div>
    </div>
  );