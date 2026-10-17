import { useState, useEffect } from "react";
import { MapPin, Navigation, Share2, Satellite } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/components/ui/use-toast";

export default function Location() {
  const { toast } = useToast();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { getCurrentLocation(); }, []);

  const getCurrentLocation = () => {
    setLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setLocation(loc);
          reverseGeocode(loc);
          setLoading(false);
        },
        error => {
          console.error("Error getting location:", error);
          toast({ title: "Location Error", description: "Please enable location services.", variant: "destructive" });
          setLoading(false);
        }
      );
    }
  };

  const reverseGeocode = async (loc: { lat: number; lng: number }) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      setAddress(data.display_name || `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
    } catch {
      setAddress(`${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
    }
  };

  const shareLocation = () => {
    if (!location) return;
    const message = `Emergency! My location: https://www.google.com/maps?q=${location.lat},${location.lng}`;
    if (navigator.share) {
      navigator.share({ title: "Emergency Location", text: message });
    } else {
      navigator.clipboard.writeText(message);
      toast({ title: "📋 Copied!", description: "Location link copied to clipboard" });
    }
  };

  return (
    <div
      className="min-h-screen p-4 pb-24 page-enter"
      style={{ background: 'linear-gradient(135deg, hsl(340 100% 98%) 0%, hsl(280 100% 98%) 100%)' }}
    >
      <div className="max-w-md mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(340 80% 60%), hsl(280 70% 55%))' }}
          >
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Location Tracking</h1>
            <p className="text-xs text-muted-foreground">Real-time GPS tracking</p>
          </div>
        </div>

        {/* Main location card */}
        <div
          className="p-6 rounded-3xl space-y-4"
          style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(236, 72, 153, 0.15)',
            boxShadow: '0 8px 32px rgba(236, 72, 153, 0.1)'
          }}
        >
          {/* Location indicator */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(340 80% 60%), hsl(280 70% 55%))' }}
              >
                <MapPin className="w-8 h-8 text-white" />
              </div>
              {location && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white animate-pulse"
                />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Current Location</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border border-pink-400 border-t-transparent rounded-full animate-spin inline-block" />
                    Getting your location...
                  </span>
                ) : address || "Location unavailable"}
              </p>
            </div>
          </div>

          {/* Coordinates */}
          {location && (
            <div
              className="p-3 rounded-2xl"
              style={{ background: 'rgba(236, 72, 153, 0.05)', border: '1px solid rgba(236, 72, 153, 0.1)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Satellite className="w-3 h-3 text-primary" />
                <p className="text-xs text-muted-foreground font-medium">GPS Coordinates</p>
              </div>
              <p className="font-mono text-sm text-foreground">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={getCurrentLocation}
              className="py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium transition-all"
              style={{
                background: 'rgba(236, 72, 153, 0.1)',
                color: 'hsl(340 80% 60%)',
                border: '1px solid rgba(236, 72, 153, 0.2)'
              }}
            >
              <Navigation className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={shareLocation}
              disabled={!location}
              className="py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium text-white transition-all btn-gradient"
              style={{ opacity: location ? 1 : 0.5 }}
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* Map placeholder */}
        {location && (
          <div
            className="rounded-3xl overflow-hidden card-hover"
            style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(236, 72, 153, 0.15)'
            }}
          >
            <a
              href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div
                className="aspect-video flex flex-col items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, hsl(340 100% 97%), hsl(280 100% 97%))' }}
              >
                <MapPin className="w-12 h-12 text-primary" />
                <p className="text-sm font-medium text-primary">Open in Google Maps</p>
                <p className="text-xs text-muted-foreground">Tap to view your location</p>
              </div>
            </a>
          </div>
        )}

        {/* Info card */}
        <div
          className="p-4 rounded-2xl"
          style={{
            background: 'rgba(236, 72, 153, 0.05)',
            border: '1px solid rgba(236, 72, 153, 0.15)'
          }}
        >
          <h3 className="font-semibold text-sm gradient-text mb-1">🛡️ Auto Location Sharing</h3>
          <p className="text-xs text-muted-foreground">
            Your location is automatically shared with emergency contacts when SOS is activated.
          </p>
        </div>
      </div>

      <BottomNav currentTab="location" onTabChange={() => {}} />
    </div>
  );
}