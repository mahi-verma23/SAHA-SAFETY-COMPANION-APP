import BottomNav from "@/components/BottomNav";
import { SafetyToolsPanel } from "@/components/SafetyToolsPanel";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Phone, PhoneOff, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface FakeAudio {
  id: string;
  name: string;
  url: string;
}

export default function Tools() {
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callerName, setCallerName] = useState("Mom");
  const [fakeAudios, setFakeAudios] = useState<FakeAudio[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<FakeAudio | null>(null);
  const ringtoneRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const callAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load saved fake audios from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('saha_fake_audios') || '[]');
    setFakeAudios(saved);
    if (saved.length > 0) setSelectedAudio(saved[0]);
  }, []);

  // Realistic ringtone using Web Audio API
  const playRingtone = () => {
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, audioContext.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + start + 0.01);
      gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + start + duration);
      osc.start(audioContext.currentTime + start);
      osc.stop(audioContext.currentTime + start + duration + 0.1);
    };

    // Indian phone ringtone pattern
    const ring = () => {
      playTone(800, 0, 0.15);
      playTone(640, 0.2, 0.15);
      playTone(800, 0.4, 0.15);
      playTone(640, 0.6, 0.15);
    };

    ring();
    ringtoneRef.current = setInterval(() => {
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const r = () => {
        [0, 0.2, 0.4, 0.6].forEach((t, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = i % 2 === 0 ? 800 : 640;
          o.type = 'sine';
          g.gain.setValueAtTime(0, ctx.currentTime + t);
          g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + t + 0.01);
          g.gain.linearRampToValueAtTime(0, ctx.currentTime + t + 0.15);
          o.start(ctx.currentTime + t);
          o.stop(ctx.currentTime + t + 0.3);
        });
      };
      r();
    }, 2000);
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      clearInterval(ringtoneRef.current);
      ringtoneRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const handleStartFakeCall = () => {
    setShowFakeCall(true);
    setCallAccepted(false);
    playRingtone();
    if (navigator.vibrate) {
      navigator.vibrate([1000, 500, 1000, 500, 1000]);
    }
  };

  const handleAcceptCall = () => {
    stopRingtone();
    setCallAccepted(true);

    // Play uploaded audio conversation
    if (selectedAudio) {
      const audio = new Audio(selectedAudio.url);
      callAudioRef.current = audio;
      audio.play();
      audio.onended = () => {
        setShowFakeCall(false);
        setCallAccepted(false);
      };
    }
  };

  const handleEndFakeCall = () => {
    stopRingtone();
    if (callAudioRef.current) {
      callAudioRef.current.pause();
      callAudioRef.current = null;
    }
    setShowFakeCall(false);
    setCallAccepted(false);
    toast.success("Call ended");
  };

  // Upload fake audio
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const newAudio: FakeAudio = {
        id: Date.now().toString(),
        name: file.name.replace(/\.[^/.]+$/, ''), // remove extension
        url: base64
      };

      const updated = [...fakeAudios, newAudio];
      setFakeAudios(updated);
      setSelectedAudio(newAudio);
      localStorage.setItem('saha_fake_audios', JSON.stringify(updated));
      toast.success(`"${newAudio.name}" uploaded as fake call audio`);
    };
  };

  const handleDeleteAudio = (id: string) => {
    const updated = fakeAudios.filter(a => a.id !== id);
    setFakeAudios(updated);
    localStorage.setItem('saha_fake_audios', JSON.stringify(updated));
    if (selectedAudio?.id === id) {
      setSelectedAudio(updated[0] || null);
    }
    toast.success("Audio deleted");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-background p-4 pb-24">
      <div className="max-w-md mx-auto space-y-4">
        <SafetyToolsPanel onStartFakeCall={handleStartFakeCall} />

        {/* Fake Call Audio Upload Section */}
        <Card
          className="p-4 space-y-3 border border-white/40"
          style={{
            background: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <h3 className="font-semibold text-primary">🎭 Fake Call Conversations</h3>
          <p className="text-xs text-muted-foreground">
            Upload a real-sounding conversation audio. It will play automatically when you accept the fake call.
          </p>

          {/* Upload button */}
          <label className="flex items-center gap-2 cursor-pointer w-full py-3 px-4 rounded-xl bg-pink-500 text-white hover:bg-pink-600 transition-all justify-center">
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">Upload Conversation Audio</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleAudioUpload}
            />
          </label>

          {/* Saved audios */}
          {fakeAudios.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Saved conversations:</p>
              {fakeAudios.map(audio => (
                <div
                  key={audio.id}
                  onClick={() => setSelectedAudio(audio)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    selectedAudio?.id === audio.id
                      ? 'bg-pink-100 border-2 border-pink-400'
                      : 'bg-white/50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎵</span>
                    <span className="text-sm font-medium truncate max-w-[180px]">{audio.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedAudio?.id === audio.id && (
                      <span className="text-xs text-pink-500 font-medium">Selected</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteAudio(audio.id); }}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {fakeAudios.length === 0 && (
            <p className="text-xs text-center text-muted-foreground py-2">
              No conversations uploaded yet. Upload one to make your fake call sound real!
            </p>
          )}
        </Card>
      </div>

      {/* Fake Call Dialog */}
      <Dialog open={showFakeCall} onOpenChange={() => {}}>
        <DialogContent
          className="border-none max-w-sm mx-auto"
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            {/* Caller avatar with pulse */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-green-400/30 animate-ping" />
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center relative">
                <span className="text-4xl">👩</span>
              </div>
            </div>

            {/* Caller name */}
            <div className="text-center space-y-1">
              <input
                value={callerName}
                onChange={e => setCallerName(e.target.value)}
                className="text-2xl font-bold text-white bg-transparent text-center border-none outline-none"
                placeholder="Mom"
              />
              <p className="text-white/60 text-sm animate-pulse">
                {callAccepted ? '00:' + String(Math.floor(Date.now() / 1000) % 60).padStart(2, '0') : 'Incoming call...'}
              </p>
            </div>

            {/* Selected audio name */}
            {selectedAudio && !callAccepted && (
              <p className="text-white/40 text-xs">
                Will play: {selectedAudio.name}
              </p>
            )}

            {/* Call buttons */}
            <div className="flex gap-12 mt-4">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleEndFakeCall}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all"
                >
                  <PhoneOff className="w-7 h-7 text-white" />
                </button>
                <span className="text-white/60 text-xs">Decline</span>
              </div>

              {!callAccepted && (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={handleAcceptCall}
                    className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all animate-bounce"
                  >
                    <Phone className="w-7 h-7 text-white" />
                  </button>
                  <span className="text-white/60 text-xs">Accept</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav currentTab="tools" onTabChange={() => {}} />
    </div>
  );
}