import { useState, useEffect } from "react";
import { Server, Users, ExternalLink, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ServerData {
  id: string;
  guild_id: string;
  name: string;
  icon: string | null;
  slug: string;
  member_count: number;
  verified_count: number;
}

const ServersTab = () => {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const fetchServers = async () => {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/discord-api?action=servers`);
      const data = await res.json();
      if (Array.isArray(data)) setServers(data);
    } catch (e) {
      console.error("Failed to fetch servers:", e);
    } finally {
      setLoading(false);
    }
  };

  const syncServers = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/discord-api?action=sync-servers`, {
        method: "POST",
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setServers(data);
        toast.success(`Synced ${data.length} servers from Discord!`);
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch (e) {
      toast.error("Failed to sync servers");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { fetchServers(); }, []);

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/verify/${slug}`);
    toast.success("Verify link copied!");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Servers</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage servers the bot is in</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Server className="w-4 h-4" /> {servers.length} servers
          </span>
          <Button
            onClick={syncServers}
            disabled={syncing}
            className="gradient-primary text-primary-foreground font-semibold hover:opacity-90"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync from Discord"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading servers...</div>
      ) : servers.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Server className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No servers yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Click "Sync from Discord" to import your bot's servers.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {servers.map((server) => (
            <div key={server.id} className="glass-card rounded-xl p-5 flex items-center justify-between hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center overflow-hidden">
                  {server.icon ? (
                    <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
                  ) : (
                    <Server className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{server.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> {server.member_count.toLocaleString()} members
                    </span>
                    <span className="text-xs text-primary flex items-center gap-1">
                      ✓ {server.verified_count.toLocaleString()} verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyLink(server.slug)}
                  className="text-xs border-border text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Link
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServersTab;
