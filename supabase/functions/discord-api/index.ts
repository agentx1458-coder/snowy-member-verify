import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const botToken = Deno.env.get("DISCORD_BOT_TOKEN")!;

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  try {
    // GET /discord-api?action=servers - List bot's guilds
    // GET /discord-api?action=members&guild_id=xxx - List verified members
    // POST /discord-api?action=sync-servers - Sync bot's servers to DB
    // POST /discord-api?action=pull-members - Pull members to a server
    // POST /discord-api?action=settings - Update server settings

    const action = url.searchParams.get("action");

    if (req.method === "GET" && action === "servers") {
      const { data, error } = await supabase.from("servers").select("*").order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    if (req.method === "GET" && action === "members") {
      const guildId = url.searchParams.get("guild_id");
      let query = supabase.from("verified_members").select("*").order("created_at", { ascending: false });
      if (guildId) query = query.eq("guild_id", guildId);
      const { data, error } = await query;
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    if (req.method === "POST" && action === "sync-servers") {
      // Fetch bot's guilds from Discord
      const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
        headers: { Authorization: `Bot ${botToken}` },
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Discord API error:", err);
        return json({ error: "Failed to fetch guilds" }, 500);
      }

      const guilds = await res.json();

      for (const guild of guilds) {
        const slug = guild.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        
        // Get member count
        let memberCount = 0;
        try {
          const guildRes = await fetch(`https://discord.com/api/v10/guilds/${guild.id}?with_counts=true`, {
            headers: { Authorization: `Bot ${botToken}` },
          });
          if (guildRes.ok) {
            const guildData = await guildRes.json();
            memberCount = guildData.approximate_member_count || 0;
          }
        } catch (e) {
          console.error("Failed to get member count:", e);
        }

        await supabase.from("servers").upsert({
          guild_id: guild.id,
          name: guild.name,
          icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
          slug,
          member_count: memberCount,
        }, { onConflict: "guild_id" });
      }

      const { data } = await supabase.from("servers").select("*").order("created_at", { ascending: false });
      return json(data);
    }

    if (req.method === "POST" && action === "pull-members") {
      const body = await req.json();
      const { source_guild_id, target_guild_id, role_id } = body;

      if (!source_guild_id || !target_guild_id) {
        return json({ error: "source_guild_id and target_guild_id required" }, 400);
      }

      // Get all verified members from source guild
      const { data: members, error } = await supabase
        .from("verified_members")
        .select("*")
        .eq("guild_id", source_guild_id);

      if (error) return json({ error: error.message }, 500);
      if (!members || members.length === 0) {
        return json({ error: "No verified members in source guild" }, 400);
      }

      let added = 0;
      let failed = 0;

      for (const member of members) {
        try {
          const joinRes = await fetch(
            `https://discord.com/api/v10/guilds/${target_guild_id}/members/${member.discord_id}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bot ${botToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                access_token: member.access_token,
                ...(role_id ? { roles: [role_id] } : {}),
              }),
            }
          );

          if (joinRes.ok || joinRes.status === 201 || joinRes.status === 204) {
            added++;
            // If already in guild (204) and role specified, add role
            if (joinRes.status === 204 && role_id) {
              await fetch(
                `https://discord.com/api/v10/guilds/${target_guild_id}/members/${member.discord_id}/roles/${role_id}`,
                {
                  method: "PUT",
                  headers: { Authorization: `Bot ${botToken}` },
                }
              );
            }
          } else {
            failed++;
            const errText = await joinRes.text();
            console.error(`Failed to add ${member.discord_id}:`, errText);
          }

          // Rate limit: wait 1s between requests
          await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
          failed++;
          console.error(`Error adding ${member.discord_id}:`, e);
        }
      }

      return json({ added, failed, total: members.length });
    }

    if (req.method === "POST" && action === "settings") {
      const body = await req.json();
      const { guild_id, verify_role_id, webhook_url, alt_blocking, alt_notify, verify_logs } = body;

      if (!guild_id) return json({ error: "guild_id required" }, 400);

      const { error } = await supabase
        .from("servers")
        .update({
          verify_role_id: verify_role_id || null,
          webhook_url: webhook_url || null,
          alt_blocking: alt_blocking ?? true,
          alt_notify: alt_notify ?? true,
          verify_logs: verify_logs ?? true,
        })
        .eq("guild_id", guild_id);

      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);

  } catch (error) {
    console.error("API error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
