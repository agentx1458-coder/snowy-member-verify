import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (password === "noahxcord") {
        localStorage.setItem("smc_auth", "true");
        navigate("/dashboard");
      } else {
        setError(true);
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4 glow-primary animate-pulse-glow">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Snowy Member Cord</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter password to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
            />
          </div>
          {error && <p className="text-destructive text-sm">Incorrect password. Try again.</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            {loading ? "Authenticating..." : "Access Dashboard"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
