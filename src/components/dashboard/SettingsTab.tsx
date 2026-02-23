import { useState, useEffect } from "react";
import { Settings, Webhook, Shield, Bell, Save, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ServerOption {
  guild_id: string;
  name: string;
  verify_role_id: string | null;
  webhook_url: string | null;
  alt_blocking: boolean;
  alt_notify: boolean;
  verify_logs: boolean;
}

const SettingsTab = () => {
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [selectedGuild, setSelectedGuild] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [verifyRoleId, setVerifyRoleId] = useState("");
  const [altBlocking, setAltBlocking] = useState(true);
  const [altNotify, setAltNotify] = useState(true);
  const [verifyLogs, setVerifyLogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    fetch(`${supabaseUrl}/functions/v1/discord-api?action=servers`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setServers(data);
          if (data.length > 0) {
            setSelectedGuild(data[0].guild_id);
            loadServerSettings(data[0]);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const loadServerSettings = (server: ServerOption) => {
    setVerifyRoleId(server.verify_role_id || "");
    setWebhookUrl(server.webhook_url || "");
    setAltBlocking(server.alt_blocking);
    setAltNotify(server.alt_notify);
    setVerifyLogs(server.verify_logs);
  };

  const handleServerChange = (guildId: string) => {
    setSelectedGuild(guildId);
    const server = servers.find(s => s.guild_id === guildId);
    if (server) loadServerSettings(server);
  };

  const handleSave = async () => {
    if (!selectedGuild) {
      toast.error("Select a server first");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/discord-api?action=settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guild_id: selectedGuild,
          verify_role_id: verifyRoleId,
          webhook_url: webhookUrl,
          alt_blocking: altBlocking,
          alt_notify: altNotify,
          verify_logs: verifyLogs,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Settings saved!");
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your verification bot per server</p>
      </div>

      <div className="space-y-6">
        {/* Server Selector */}
        <div className="glass-card rounded-xl p-6">
          <Label className="text-foreground font-semibold mb-2 block">Select Server</Label>
          {servers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No servers found. Sync servers first from the Servers tab.</p>
          ) : (
            <select
              value={selectedGuild}
              onChange={(e) => handleServerChange(e.target.value)}
              className="w-full p-2 rounded-lg bg-secondary border border-border text-foreground"
            >
              {servers.map(s => (
                <option key={s.guild_id} value={s.guild_id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Verification Role */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Verification Role</h3>
              <p className="text-xs text-muted-foreground">Role to assign on successful verification</p>
            </div>
          </div>
          <Input
            placeholder="Enter Role ID"
            value={verifyRoleId}
            onChange={(e) => setVerifyRoleId(e.target.value)}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Webhook */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Webhook className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Verification Logs Webhook</h3>
              <p className="text-xs text-muted-foreground">Discord webhook URL for logging verifications</p>
            </div>
          </div>
          <Input
            placeholder="https://discord.com/api/webhooks/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Toggles */}
        <div className="glass-card rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Settings className="w-4 h-4 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">Features</h3>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="verify-logs" className="flex items-center gap-2 text-foreground cursor-pointer">
              <Bell className="w-4 h-4 text-muted-foreground" />
              Verification Logs
            </Label>
            <Switch id="verify-logs" checked={verifyLogs} onCheckedChange={setVerifyLogs} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="alt-blocking" className="flex items-center gap-2 text-foreground cursor-pointer">
              <Shield className="w-4 h-4 text-muted-foreground" />
              Block Alt Accounts
            </Label>
            <Switch id="alt-blocking" checked={altBlocking} onCheckedChange={setAltBlocking} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="alt-notify" className="flex items-center gap-2 text-foreground cursor-pointer">
              <Bell className="w-4 h-4 text-muted-foreground" />
              Notify Alts in Logs
            </Label>
            <Switch id="alt-notify" checked={altNotify} onCheckedChange={setAltNotify} />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          {saving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Settings</>}
        </Button>
      </div>
    </div>
  );
};

export default SettingsTab;
