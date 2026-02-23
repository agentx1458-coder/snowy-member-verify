import { useState } from "react";
import { Settings, Webhook, Shield, Bell, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const SettingsTab = () => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [verifyRoleId, setVerifyRoleId] = useState("");
  const [altBlocking, setAltBlocking] = useState(true);
  const [altNotify, setAltNotify] = useState(true);
  const [verifyLogs, setVerifyLogs] = useState(true);

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your verification bot</p>
      </div>

      <div className="space-y-6">
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
          className="gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default SettingsTab;
