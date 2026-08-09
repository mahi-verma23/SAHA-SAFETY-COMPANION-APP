import { Shield, Users, MapPin, MessageSquare, Wrench, Folder } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  const navigate = useNavigate();

  const tabs = [
    { id: "sos", label: "SOS", icon: Shield, path: "/" },
    { id: "tools", label: "Tools", icon: Wrench, path: "/tools" },
    { id: "location", label: "Location", icon: MapPin, path: "/location" },
    { id: "chat", label: "AI Chat", icon: MessageSquare, path: "/chat" },
    { id: "contacts", label: "Contacts", icon: Users, path: "/contacts" },
    { id: "evidence", label: "Evidence", icon: Folder, path: "/evidence" },
  ];

  const handleTabClick = (tab: typeof tabs[0]) => {
    onTabChange(tab.id);
    navigate(tab.path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-2 py-2 grid grid-cols-6 gap-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
