import { useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import SOSButton from "@/components/SOSButton"
import BottomNav from "@/components/BottomNav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.jpeg";
import { Mic, MicOff } from "lucide-react";
import { useRef } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function Home() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("sos");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const [autoTriggerSOS, setAutoTriggerSOS] = useState(false);

  const startVoiceDetection = () => {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    toast({
      title: "⚠️ Not supported",
      description: "Use Chrome browser for voice detection",
      variant: "destructive"
    });
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'hi-IN';

  const distressWords = [
    "help", "bachao", "bacho", "mujhe bachao",
    "save me", "emergency", "danger", "chhodo",
    "madad", "help karo", "bachao mujhe",
    "छोड़ो", "बचाओ", "मदद", "help me"
  ];

  recognition.onresult = (event: any) => {
    const transcript = Array.from(event.results)
      .map((result: any) => result[0].transcript)
      .join(' ')
      .toLowerCase();

    console.log("Heard:", transcript);

    const detected = distressWords.some(word =>
      transcript.includes(word)
    );

    if (detected) {
      recognition.stop();
      setIsListening(false);
      toast({
        title: "🚨 Distress detected!",
        description: "Triggering SOS automatically...",
        variant: "destructive"
      });
      // Auto trigger SOS
       setAutoTriggerSOS(true);
    }
  };

  recognition.onerror = (event: any) => {
    console.error("Recognition error:", event.error);
    setIsListening(false);
  };

  recognition.onend = () => {
    if (isListening) {
      recognition.start(); // restart if still listening
    }
  };

  recognitionRef.current = recognition;
  recognition.start();
  setIsListening(true);

  toast({
    title: "🎙️ Listening...",
    description: "Say 'Bachao' or 'Help' to trigger SOS"
  });
};

const stopVoiceDetection = () => {
  if (recognitionRef.current) {
    recognitionRef.current.stop();
    recognitionRef.current = null;
  }
  setIsListening(false);
  toast({
    title: "Voice detection stopped"
  });
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-background pb-20">
      <header className="p-4 flex items-center justify-between bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <img src={logo} alt="SAHA Logo" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h1 className="text-lg font-bold text-primary">SAHA</h1>
            <p className="text-xs text-muted-foreground">for you, with you</p>
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <SettingsIcon className="w-5 h-5 text-primary" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="mt-8 space-y-4">
              <h2 className="text-lg font-semibold">Settings</h2>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/contacts")}
                >
                  Emergency Contacts
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="p-4">
        <SOSButton autoTrigger={autoTriggerSOS} onAutoTriggerDone={() => setAutoTriggerSOS(false)} />
        {/* Voice Detection Button */}
        <button
          onClick={isListening ? stopVoiceDetection : startVoiceDetection}
          className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-white font-medium transition-all ${
            isListening
              ? 'bg-red-500 animate-pulse'
              : 'bg-pink-500 hover:bg-pink-600'
          }`}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
          <span>
            {isListening ? 'Listening... (tap to stop)' : 'EMERGENCY'}
          </span>
        </button>
      </main>

      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}
