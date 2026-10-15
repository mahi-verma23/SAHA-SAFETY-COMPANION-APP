import { useState, useRef } from "react";
import { Settings as SettingsIcon, Mic, MicOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import SOSButton from "@/components/SOSButton";
import BottomNav from "@/components/BottomNav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.jpeg";
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

      const detected = distressWords.some(word => transcript.includes(word));
      if (detected) {
        recognition.stop();
        setIsListening(false);
        toast({
          title: "🚨 Distress detected!",
          description: "Triggering SOS automatically...",
          variant: "destructive"
        });
        setAutoTriggerSOS(true);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) recognition.start();
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
    toast({ title: "Voice detection stopped" });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen pb-20 page-enter"
      style={{
        background: 'linear-gradient(135deg, hsl(340 100% 98%) 0%, hsl(280 100% 98%) 50%, hsl(0 0% 100%) 100%)'
      }}
    >
      {/* Header */}
      <header
        className="p-4 flex items-center justify-between sticky top-0 z-10"
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(236, 72, 153, 0.1)'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-pink-400/30 animate-ping" 
              style={{ animationDuration: '3s' }} />
            <img 
              src={logo} 
              alt="SAHA Logo" 
              className="w-10 h-10 rounded-full object-cover relative z-10 ring-2 ring-pink-300" 
            />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">SAHA</h1>
            <p className="text-xs text-muted-foreground">for you, with you</p>
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full hover:bg-pink-50 transition-all"
            >
              <SettingsIcon className="w-5 h-5 text-primary" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold gradient-text">Settings</h2>
              </div>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl border-pink-200 hover:bg-pink-50 hover:border-pink-300 transition-all"
                  onClick={() => navigate("/contacts")}
                >
                  👥 Emergency Contacts
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl border-pink-200 hover:bg-pink-50 hover:border-pink-300 transition-all"
                  onClick={() => navigate("/location")}
                >
                  📍 My Location
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl border-red-200 hover:bg-red-50 hover:border-red-300 transition-all text-red-500"
                  onClick={handleLogout}
                >
                  🚪 Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="p-4 space-y-4">
        {/* SOS Button */}
        <SOSButton 
          autoTrigger={autoTriggerSOS} 
          onAutoTriggerDone={() => setAutoTriggerSOS(false)} 
        />

        {/* Voice Guard Button */}
        <button
          onClick={isListening ? stopVoiceDetection : startVoiceDetection}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-medium transition-all card-hover"
          style={{
            background: isListening
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, hsl(340 80% 60%), hsl(280 70% 55%))',
            color: 'white',
            boxShadow: isListening
              ? '0 4px 20px rgba(239, 68, 68, 0.4)'
              : '0 4px 20px rgba(236, 72, 153, 0.3)',
            animation: isListening ? 'pulse 2s infinite' : 'none'
          }}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
          <span>
            {isListening ? '🎙️ Listening... (tap to stop)' : '🛡️ Voice Guard — Tap to Activate'}
          </span>
        </button>

        {/* Safety tip card */}
        <div
          className="p-4 rounded-2xl glass"
          style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}
        >
          <p className="text-xs text-center text-muted-foreground">
            💡 <strong>Tip:</strong> Press & hold SOS for 3 seconds or say "Bachao" to trigger emergency alerts
          </p>
        </div>
      </main>

      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}