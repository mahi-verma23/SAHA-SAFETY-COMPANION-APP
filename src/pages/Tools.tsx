import BottomNav from "@/components/BottomNav";
import { SafetyToolsPanel } from "@/components/SafetyToolsPanel";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Tools() {
  const [showFakeCall, setShowFakeCall] = useState(false);

  const handleStartFakeCall = () => {
    setShowFakeCall(true);
    toast.success("Incoming call...");
    
    // Play ringtone sound
    const audioContext = new AudioContext();
    const playRingtone = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 523.25; // C5 note
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.frequency.value = 659.25; // E5 note
        oscillator2.type = 'sine';
        gainNode2.gain.value = 0.3;
        
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.3);
      }, 300);
    };
    
    playRingtone();
    const ringtoneInterval = setInterval(playRingtone, 2000);
    
    setTimeout(() => {
      clearInterval(ringtoneInterval);
    }, 10000);
    
    if (navigator.vibrate) {
      navigator.vibrate([1000, 500, 1000, 500, 1000]);
    }
  };

  const handleEndFakeCall = () => {
    setShowFakeCall(false);
    toast.success("Call ended");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-background p-4 pb-24">
      <div className="max-w-md mx-auto">
        <SafetyToolsPanel onStartFakeCall={handleStartFakeCall} />
      </div>

      {/* Fake Call Dialog */}
      <Dialog open={showFakeCall} onOpenChange={setShowFakeCall}>
        <DialogContent className="bg-gradient-to-b from-primary to-primary/90 text-primary-foreground border-none">
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <Phone className="w-12 h-12" />
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Mom</h2>
              <p className="text-white/80">Calling...</p>
            </div>

            <div className="flex gap-8 mt-8">
              <Button
                onClick={handleEndFakeCall}
                size="lg"
                className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
              
              <Button
                onClick={handleEndFakeCall}
                size="lg"
                className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600"
              >
                <Phone className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav currentTab="tools" onTabChange={() => {}} />
    </div>
  );
}
