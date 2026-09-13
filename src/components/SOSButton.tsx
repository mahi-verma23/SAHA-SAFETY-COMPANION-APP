import { useState, useEffect, useRef } from "react";
import { AlertCircle, MapPin, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SOSButtonProps {
  autoTrigger?: boolean;
  onAutoTriggerDone?: () => void;
}

export default function SOSButton({ autoTrigger, onAutoTriggerDone }: SOSButtonProps) {
  const { toast } = useToast();
  const [isPressed, setIsPressed] = useState(false);
  const [pressTime, setPressTime] = useState(0);
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [lastActivity, setLastActivity] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pressStartRef = useRef<number>(0);
  const isSendingRef = useRef<boolean>(false);

  useEffect(() => {
    setLastActivity(new Date().toLocaleString());

    // Load last known location immediately
    const saved = localStorage.getItem('saha_last_location');
    if (saved) {
      setLocation(JSON.parse(saved));
    }

    // Try to get fresh location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(loc);
          // Save fresh location to storage
          localStorage.setItem('saha_last_location', JSON.stringify(loc));
        },
        error => {
          console.error("Location error:", error);
          if (!saved) {
            // No last known location available
            toast({
              title: "⚠️ Location unavailable",
              description: "Enable GPS for accurate location sharing"
            });
          } else {
            toast({
              title: "⚠️ Using last known location",
              description: "Enable GPS for real-time location"
            });
          }
        }
      );
    }
  }, []);
    useEffect(() => {
      if (autoTrigger) {
        handleSOSPress();
        onAutoTriggerDone?.();
      }
    }, [autoTrigger]);

  const handleSOSPress = async () => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;

    console.log("SOS triggered!", location);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "❌ Error",
          description: "Please login first",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "🚨 SOS Activated!",
        description: "Sending emergency alerts...",
        variant: "destructive"
      });

      // Save to database
      await supabase.from("sos_alerts").insert({
        user_id: user.id,
        latitude: location?.lat,
        longitude: location?.lng,
        trigger_type: "button",
        status: "active"
      });

      // Get emergency contacts
      const { data: contacts } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user.id);

      // Send SMS via Flask
      if (contacts && contacts.length > 0) {
        for (const contact of contacts) {
          await fetch(`${import.meta.env.VITE_BACKEND_URL}/sos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: location?.lat || 28.6139,
              lng: location?.lng || 77.2090,
              contact: contact.phone
            })
          });
        }

        toast({
          title: "✅ Alert Sent!",
          description: `SMS sent to ${contacts.length} emergency contact(s)!`,
        });
      } else {
        toast({
          title: "⚠️ No Contacts",
          description: "Please add emergency contacts first",
          variant: "destructive"
        });
      }

      // Call 112
      setTimeout(() => {
        window.location.href = 'tel:112';
      }, 2000);

    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      isSendingRef.current = false;
    }
  };

  const handlePressStart = () => {
    if (timerRef.current) return;
    console.log("Press started!");
    setIsPressed(true);
    pressStartRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - pressStartRef.current) / 1000;
      const capped = Math.min(elapsed, 3);
      setPressTime(capped);

      if (elapsed >= 3) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsPressed(false);
        setPressTime(0);
        handleSOSPress();
      }
    }, 50);
  };

  const handlePressEnd = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPressed(false);
    setPressTime(0);
  };

  const progress = (pressTime / 3) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="relative">
          {isPressed && (
            <div
              className="absolute inset-0 rounded-full bg-red-500/30 animate-ping"
              style={{ animationDuration: '0.5s' }}
            />
          )}

          <button
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            className="relative w-48 h-48 rounded-full bg-gradient-to-br from-red-600 to-red-400 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 select-none"
            style={{
              boxShadow: isPressed
                ? "0 8px 40px rgba(239, 68, 68, 0.7)"
                : "0 8px 30px rgba(239, 68, 68, 0.3)"
            }}
          >
            {isPressed && (
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="white"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                />
              </svg>
            )}
            <AlertCircle className="w-16 h-16 text-white mb-2" />
            <span className="text-2xl font-bold text-white">SOS</span>
            <span className="text-sm text-white/90 mt-1">
              {isPressed ? `${(3 - pressTime).toFixed(1)}s` : "Press & Hold"}
            </span>
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground max-w-xs">
          Press and hold for 3 seconds to send emergency alert
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Current Location</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {location
            ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
            : "Getting location..."}
        </p>
        <div className="flex items-center gap-2 text-sm pt-2 border-t">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Last Activity</span>
        </div>
        <p className="text-xs text-muted-foreground">{lastActivity}</p>
      </Card>
    </div>
  );
}