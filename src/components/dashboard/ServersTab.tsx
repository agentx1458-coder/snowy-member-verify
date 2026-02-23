import { Server, Users, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const mockServers = [
  { id: "1", name: "Snowy Studios", members: 1247, verified: 892, icon: "❄️" },
  { id: "2", name: "Market Hub", members: 534, verified: 421, icon: "🏪" },
  { id: "3", name: "Dev Community", members: 2103, verified: 1567, icon: "💻" },
];

const ServersTab = () => {
  const copyLink = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Server className="w-4 h-4" />
          {mockServers.length} servers
        </div>
      </div>

      <div className="grid gap-4">
        {mockServers.map((server) => (
          <div key={server.id} className="glass-card rounded-xl p-5 flex items-center justify-between hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                {server.icon}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{server.name}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> {server.members.toLocaleString()} members
                  </span>
                  <span className="text-xs text-primary flex items-center gap-1">
                    ✓ {server.verified.toLocaleString()} verified
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyLink(server.name)}
                className="text-xs border-border text-muted-foreground hover:text-foreground"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-border text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Manage
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServersTab;
