import { useState, useEffect } from "react";
import { MapPin, Navigation, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/components/ui/use-toast";
export default function Location() {
  const {
    toast
  } = useToast();
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    getCurrentLocation();
  }, []);
  const getCurrentLocation = () => {
    setLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocation(loc);
        reverseGeocode(loc);
        setLoading(false);
      }, error => {
        console.error("Error getting location:", error);
        toast({
          title: "Location Error",
          description: "Could not get your location. Please enable location services.",
          variant: "destructive"
        });
        setLoading(false);
      });
    }
  };
  const reverseGeocode = async (loc: {
    lat: number;
    lng: number;
  }) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`Lat: ${loc.lat.toFixed(4)}, Lng: ${loc.lng.toFixed(4)}`);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setAddress(`Lat: ${loc.lat.toFixed(4)}, Lng: ${loc.lng.toFixed(4)}`);
    }
  };
  const shareLocation = () => {
    if (!location) return;
    const message = `Emergency! My current location: https://www.google.com/maps?q=${location.lat},${location.lng}`;
    if (navigator.share) {
      navigator.share({
        title: "Emergency Location",
        text: message
      });
    } else {
      navigator.clipboard.writeText(message);
      toast({
        title: "Location copied",
        description: "Location link copied to clipboard"
      });
    }
  };
  return <div className="min-h-screen bg-gradient-to-b from-secondary to-background p-4 pb-24">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-primary">Location Tracking</h1>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Current Location</h3>
              <p className="text-sm text-muted-foreground">
                {loading ? "Getting location..." : address || "Location unavailable"}
              </p>
            </div>
          </div>

          {location && <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
              <p className="text-xs text-muted-foreground">GPS Coordinates</p>
              <p className="font-mono text-sm">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            </div>}

          <div className="pt-4 space-y-2">
            <Button onClick={getCurrentLocation} variant="outline" className="w-full">
              <Navigation className="w-4 h-4 mr-2" />
              Refresh Location
            </Button>
            
          </div>
        </Card>

        <Card className="p-4 bg-primary/5 border-primary/20">
          <h3 className="font-semibold mb-2 text-sm">Live Location Sharing</h3>
          <p className="text-xs text-muted-foreground">
            Your location is automatically shared with emergency contacts when SOS is activated.
          </p>
        </Card>

        {location && <Card className="p-4 overflow-hidden">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Map View</p>
              <p className="text-xs text-muted-foreground ml-2">
                (Would show map in production)
              </p>
            </div>
          </Card>}
      </div>

      <BottomNav currentTab="location" onTabChange={() => {}} />
    </div>;
}