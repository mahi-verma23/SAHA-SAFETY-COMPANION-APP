import { Shield, Users, MapPin, MessageSquare, Wrench, Folder } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    <nav
      className="fixed bottom-0 left-0 right-0 px-3 py-2 grid grid-cols-6 gap-1"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(236, 72, 153, 0.15)',
        boxShadow: '0 -4px 20px rgba(236, 72, 153, 0.08)'
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all"
            style={{
              background: isActive
                ? 'linear-gradient(135deg, hsl(340 80% 60%), hsl(280 70% 55%))'
                : 'transparent',
              color: isActive ? 'white' : 'hsl(340 6% 50%)',
              transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: isActive ? '0 4px 12px rgba(236, 72, 153, 0.3)' : 'none'
            }}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}