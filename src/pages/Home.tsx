import { useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import SOSButton from "@/components/SOSButton"
import BottomNav from "@/components/BottomNav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.jpeg";

export default function Home() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("sos");

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
        <SOSButton />
      </main>

      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}
