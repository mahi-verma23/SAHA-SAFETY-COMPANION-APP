import { useState, useEffect, useRef } from "react";
import { AlertCircle, Phone, PhoneCall, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
export default function SOSButton() {
  const {
    toast
  } = useToast();
  const [isPressed, setIsPressed] = useState(false);
  const [pressTime, setPressTime] = useState(0);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [lastActivity, setLastActivity] = useState<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartRef = useRef<number>(0);
  useEffect(() => {
    setLastActivity(new Date().toLocaleString());

    // Get user's location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      }, error => {
        console.error("Error getting location:", error);
      });
    }
  }, []);
  const handleSOSPress = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Create SOS alert
      const {
        error
      } = await supabase.from("sos_alerts").insert({
        user_id: user.id,
        latitude: location?.lat,
        longitude: location?.lng,
        trigger_type: "button",
        status: "active"
      });
      if (error) throw error;

      // Get emergency contacts
      const {
        data: contacts
      } = await supabase.from("emergency_contacts").select("*").eq("user_id", user.id);
      if (contacts && contacts.length > 0 && location) {
        // Send location to emergency contacts via SMS
        const locationUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
        const message = `EMERGENCY! I need help. My current location: ${locationUrl}`;

        // Send SMS to each emergency contact
        for (const contact of contacts) {
          try {
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sos-alert`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({
                phone: contact.phone,
                message: message,
                contactName: contact.name
              })
            });
          } catch (err) {
            console.error("Error sending alert to contact:", err);
          }
        }
      }
      toast({
        title: "SOS Activated!",
        description: `Emergency alert sent to ${contacts?.length || 0} contacts. Calling 112...`,
        variant: "destructive"
      });

      // Automatically call 112
      window.location.href = 'tel:112';
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handlePressStart = () => {
    setIsPressed(true);
    pressStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.min((Date.now() - pressStartRef.current) / 1000, 3);
      setPressTime(elapsed);
      if (elapsed >= 3) {
        handlePressEnd();
        handleSOSPress();
      }
    }, 50);
  };
  const handlePressEnd = () => {
    setIsPressed(false);
    setPressTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  const progress = pressTime / 3 * 100;
  return <div className="space-y-6">
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-destructive/20 animate-pulse" style={{
          transform: `scale(${1 + progress / 100})`,
          opacity: progress / 100
        }} />

          <button onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd} onTouchStart={handlePressStart} onTouchEnd={handlePressEnd} className="relative w-48 h-48 rounded-full bg-gradient-to-br from-destructive to-destructive/80 shadow-strong flex flex-col items-center justify-center transition-all duration-200 active:scale-95" style={{
          boxShadow: isPressed ? "0 8px 40px hsl(var(--destructive) / 0.5)" : "0 8px 30px hsl(var(--destructive) / 0.2)"
        }}>
            <AlertCircle className="w-16 h-16 text-white mb-2" />
            <span className="text-2xl font-bold text-white">SOS</span>
            <span className="text-sm text-white/90 mt-1">Press & Hold</span>
          </button>

          {isPressed && <div className="absolute inset-0 rounded-full border-8 border-white">
              <svg className="w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="45%" fill="none" stroke="white" strokeWidth="8" strokeDasharray={`${progress * 3} 300`} className="transition-all duration-100" />
              </svg>
            </div>}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground max-w-xs">
          Press and hold for 3 seconds to send emergency alert to all your contacts
        </p>
      </div>

      

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Current Location</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {location ? `Getting location... (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : "Getting location..."}
        </p>

        <div className="flex items-center gap-2 text-sm pt-2 border-t">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Last Activity</span>
        </div>
        <p className="text-xs text-muted-foreground">{lastActivity}</p>
      </Card>

      
    </div>;
}