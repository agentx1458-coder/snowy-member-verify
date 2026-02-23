import { useState } from "react";
import { Users, Search, ArrowUpDown, UserPlus, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockMembers = [
  { id: "1", username: "SnowyUser#1234", discordId: "123456789", ip: "192.168.1.***", joinedAt: "2025-02-20", status: "verified", alt: false },
  { id: "2", username: "FrostByte#5678", discordId: "987654321", ip: "10.0.0.***", joinedAt: "2025-02-19", status: "verified", alt: false },
  { id: "3", username: "IcePick#9012", discordId: "456789123", ip: "172.16.0.***", joinedAt: "2025-02-18", status: "pending", alt: false },
  { id: "4", username: "DarkIce#3456", discordId: "321654987", ip: "192.168.1.***", alt: true, joinedAt: "2025-02-17", status: "flagged" },
  { id: "5", username: "Blizzard#7890", discordId: "654987321", ip: "10.0.1.***", joinedAt: "2025-02-16", status: "verified", alt: false },
];

const MembersTab = () => {
  const [search, setSearch] = useState("");

  const filtered = mockMembers.filter(
    (m) => m.username.toLowerCase().includes(search.toLowerCase()) || m.discordId.includes(search)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Members</h1>
          <p className="text-muted-foreground text-sm mt-1">View verified members and manage pulls</p>
        </div>
        <Button className="gradient-primary text-primary-foreground font-semibold hover:opacity-90">
          <UserPlus className="w-4 h-4 mr-2" />
          Pull Members
        </Button>
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

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-semibold">
                <div className="flex items-center gap-1">User <ArrowUpDown className="w-3 h-3" /></div>
              </TableHead>
              <TableHead className="text-muted-foreground font-semibold">Discord ID</TableHead>
              <TableHead className="text-muted-foreground font-semibold">IP (Hashed)</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Joined</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((member) => (
              <TableRow key={member.id} className="border-border hover:bg-secondary/50">
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {member.alt && <Shield className="w-4 h-4 text-destructive" />}
                    {member.username}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">{member.discordId}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">{member.ip}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{member.joinedAt}</TableCell>
                <TableCell>
                  <Badge
                    variant={member.status === "verified" ? "default" : member.status === "flagged" ? "destructive" : "secondary"}
                    className={
                      member.status === "verified"
                        ? "gradient-primary text-primary-foreground border-0"
                        : ""
                    }
                  >
                    {member.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
        <Shield className="w-3 h-3" />
        IPs are collected for alt detection only. Users are informed during verification.
      </p>
    </div>
  );
};

export default MembersTab;
