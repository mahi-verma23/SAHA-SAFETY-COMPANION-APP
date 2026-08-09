import { useState, useRef, useEffect } from 'react';
import { Mic, Video, Volume2, VolumeX, Phone, Circle, Square } from 'lucide-react';
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
          
          const recording = {
            id: Date.now().toString(),
            type: 'audio' as const,
            url: url,
            timestamp: new Date(),
            size: audioBlob.size,
          };
          
          window.dispatchEvent(new CustomEvent('newRecording', { detail: recording }));
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
          
          const recording = {
            id: Date.now().toString(),
            type: 'video' as const,
            url: url,
            timestamp: new Date(),
            size: videoBlob.size,
          };
          
          window.dispatchEvent(new CustomEvent('newRecording', { detail: recording }));
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


  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-primary">Safety Tools</h2>

      {/* Recording Tools */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={toggleAudioRecording}
          className={`h-24 rounded-2xl text-white ${
            isRecordingAudio
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              : 'bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            {isRecordingAudio ? (
              <Square className="w-6 h-6 fill-current" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
            <span className="text-sm">
              {isRecordingAudio ? 'Stop Recording' : 'Voice Record'}
            </span>
            {isRecordingAudio && (
              <Circle className="w-3 h-3 fill-current animate-pulse" />
            )}
          </div>
        </Button>

        <Button
          onClick={toggleVideoRecording}
          className={`h-24 rounded-2xl text-white ${
            isRecordingVideo
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              : 'bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            {isRecordingVideo ? (
              <Square className="w-6 h-6 fill-current" />
            ) : (
              <Video className="w-6 h-6" />
            )}
            <span className="text-sm">
              {isRecordingVideo ? 'Stop Recording' : 'Video Record'}
            </span>
            {isRecordingVideo && (
              <Circle className="w-3 h-3 fill-current animate-pulse" />
            )}
          </div>
        </Button>
      </div>

      {/* Alert Tools */}
      <Button
        onClick={toggleSiren}
        className={`w-full h-24 rounded-2xl text-white ${
          isSirenActive
            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse'
            : 'bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          {isSirenActive ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          <span className="text-sm">
            {isSirenActive ? 'Stop Siren' : 'Emergency Siren'}
          </span>
        </div>
      </Button>

      {/* Fake Call */}
      <Button
        onClick={onStartFakeCall}
        className="w-full h-20 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white rounded-2xl"
      >
        <div className="flex items-center justify-center gap-3">
          <Phone className="w-6 h-6" />
          <div className="text-left">
            <p className="font-medium">Fake Call</p>
            <p className="text-xs opacity-90">Simulate incoming call</p>
          </div>
        </div>
      </Button>

      {/* Recorded Media */}
      {(audioUrl || videoUrl) && (
        <Card className="p-4 bg-card rounded-2xl space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Recorded Media</h3>
          {audioUrl && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Audio Recording</p>
              <audio src={audioUrl} controls className="w-full" />
            </div>
          )}
          {videoUrl && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Video Recording</p>
              <video src={videoUrl} controls className="w-full rounded-lg" />
            </div>
          )}
        </Card>
      )}

      <Card className="bg-primary/5 border-primary/20 rounded-2xl p-4">
        <p className="text-sm text-foreground">
          💡 <strong>Tip:</strong> Recordings are stored locally on your device for privacy
        </p>
      </Card>
    </div>
  );
}
