import { useState, useEffect } from "react";
import { Users, Search, ArrowUpDown, UserPlus, Shield, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Member {
  id: string;
  guild_id: string;
  discord_id: string;
  username: string;
  avatar: string | null;
  ip_address: string | null;
  is_alt: boolean;
  status: string;
  created_at: string;
}

interface ServerOption {
  guild_id: string;
  name: string;
}

const MembersTab = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pullOpen, setPullOpen] = useState(false);
  const [sourceGuild, setSourceGuild] = useState("");
  const [targetGuild, setTargetGuild] = useState("");
  const [pullRoleId, setPullRoleId] = useState("");
  const [pulling, setPulling] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const fetchData = async () => {
    try {
      const [membersRes, serversRes] = await Promise.all([
        fetch(`${supabaseUrl}/functions/v1/discord-api?action=members`),
        fetch(`${supabaseUrl}/functions/v1/discord-api?action=servers`),
      ]);
      const membersData = await membersRes.json();
      const serversData = await serversRes.json();
      if (Array.isArray(membersData)) setMembers(membersData);
      if (Array.isArray(serversData)) setServers(serversData);
    } catch (e) {
      console.error("Failed to fetch:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePull = async () => {
    if (!sourceGuild || !targetGuild) {
      toast.error("Select source and target servers");
      return;
    }
    setPulling(true);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/discord-api?action=pull-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_guild_id: sourceGuild,
          target_guild_id: targetGuild,
          role_id: pullRoleId || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(`Pulled ${data.added} members (${data.failed} failed)`);
        setPullOpen(false);
      }
    } catch (e) {
      toast.error("Pull failed");
    } finally {
      setPulling(false);
    }
  };

  const filtered = members.filter(
    (m) => m.username.toLowerCase().includes(search.toLowerCase()) || m.discord_id.includes(search)
  );

  const maskIp = (ip: string | null) => {
    if (!ip || ip === "unknown") return "N/A";
    const parts = ip.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.***. ***`;
    return ip.substring(0, 8) + "***";
  };

  const getServerName = (guildId: string) => {
    return servers.find(s => s.guild_id === guildId)?.name || guildId;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Members</h1>
          <p className="text-muted-foreground text-sm mt-1">{members.length} verified members across all servers</p>
        </div>
        <Dialog open={pullOpen} onOpenChange={setPullOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground font-semibold hover:opacity-90">
              <UserPlus className="w-4 h-4 mr-2" />
              Pull Members
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="font-display">Pull Members</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-foreground">Source Server (pull from)</Label>
                <select
                  value={sourceGuild}
                  onChange={(e) => setSourceGuild(e.target.value)}
                  className="w-full mt-1 p-2 rounded-lg bg-secondary border border-border text-foreground"
                >
                  <option value="">Select server...</option>
                  {servers.map(s => (
                    <option key={s.guild_id} value={s.guild_id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-foreground">Target Server (pull to)</Label>
                <select
                  value={targetGuild}
                  onChange={(e) => setTargetGuild(e.target.value)}
                  className="w-full mt-1 p-2 rounded-lg bg-secondary border border-border text-foreground"
                >
                  <option value="">Select server...</option>
                  {servers.map(s => (
                    <option key={s.guild_id} value={s.guild_id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-foreground">Role ID to assign (optional)</Label>
                <Input
                  value={pullRoleId}
                  onChange={(e) => setPullRoleId(e.target.value)}
                  placeholder="Enter role ID..."
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handlePull}
                disabled={pulling}
                className="gradient-primary text-primary-foreground font-semibold hover:opacity-90"
              >
                {pulling ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Pulling...</> : "Start Pull"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card rounded-xl p-1 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by username or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading members...</div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-semibold">User</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Server</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Discord ID</TableHead>
                <TableHead className="text-muted-foreground font-semibold">IP</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Joined</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {members.length === 0 ? "No verified members yet" : "No results found"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((member) => (
                  <TableRow key={member.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {member.is_alt && <Shield className="w-4 h-4 text-destructive" />}
                        {member.username}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{getServerName(member.guild_id)}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{member.discord_id}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{maskIp(member.ip_address)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(member.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={member.status === "verified" ? "default" : "destructive"}
                        className={member.status === "verified" ? "gradient-primary text-primary-foreground border-0" : ""}
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
        <Shield className="w-3 h-3" />
        IPs are collected for alt detection only. Users are informed during verification.
      </p>
    </div>
  );
};

export default MembersTab;
