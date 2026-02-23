import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Server, Users, Settings, LogOut, ChevronRight } from "lucide-react";
import ServersTab from "@/components/dashboard/ServersTab";
import MembersTab from "@/components/dashboard/MembersTab";
import SettingsTab from "@/components/dashboard/SettingsTab";

type Tab = "servers" | "members" | "settings";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("servers");
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("smc_auth") !== "true") {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("smc_auth");
    navigate("/");
  };

  const tabs = [
    { id: "servers" as Tab, label: "Servers", icon: Server },
    { id: "members" as Tab, label: "Members", icon: Users },
    { id: "settings" as Tab, label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-bold text-foreground text-sm">Snowy Member Cord</h2>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "gradient-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-sidebar-accent transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto animate-fade-in">
          {activeTab === "servers" && <ServersTab />}
          {activeTab === "members" && <MembersTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
