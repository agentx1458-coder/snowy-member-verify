import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // guild_id:slug
  const frontendUrl = Deno.env.get("FRONTEND_URL") || url.origin;

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  const [guildId, slug] = state.split(":");
  const clientId = Deno.env.get("DISCORD_CLIENT_ID")!;
  const clientSecret = Deno.env.get("DISCORD_CLIENT_SECRET")!;
  const botToken = Deno.env.get("DISCORD_BOT_TOKEN")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Build redirect URI - must match what was sent in the OAuth URL
  const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/discord-callback`;

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Token exchange failed:", err);
      return Response.redirect(`${frontendUrl}/verify/${slug}?error=token_failed`, 302);
    }

    const tokens = await tokenRes.json();
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    // 2. Get user info
    const userRes = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return Response.redirect(`${frontendUrl}/verify/${slug}?error=user_fetch_failed`, 302);
    }

    const user = await userRes.json();
    const discordId = user.id;
    const username = user.global_name || user.username;
    const avatar = user.avatar;

    // 3. Get IP for alt detection
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") || "unknown";

    // 4. Check for alt (same IP, different discord ID, same guild)
    const { data: existingByIp } = await supabase
      .from("verified_members")
      .select("discord_id, username")
      .eq("guild_id", guildId)
      .eq("ip_address", ip)
      .neq("discord_id", discordId);

    const isAlt = existingByIp && existingByIp.length > 0;

    // 5. Get server settings
    const { data: server } = await supabase
      .from("servers")
      .select("*")
      .eq("guild_id", guildId)
      .single();

    // Check alt blocking
    if (isAlt && server?.alt_blocking) {
      return Response.redirect(`${frontendUrl}/verify/${slug}?error=alt_detected`, 302);
    }

    // 6. Store/update member
    const { error: upsertError } = await supabase
      .from("verified_members")
      .upsert({
        guild_id: guildId,
        discord_id: discordId,
        username,
        avatar,
        access_token: accessToken,
        refresh_token: refreshToken,
        ip_address: ip,
        is_alt: isAlt,
        status: isAlt ? "flagged" : "verified",
      }, { onConflict: "guild_id,discord_id" });

    if (upsertError) {
      console.error("Upsert error:", upsertError);
    }

    // 7. Add member to guild using bot token + OAuth access token (guilds.join)
    const joinRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: accessToken,
          ...(server?.verify_role_id ? { roles: [server.verify_role_id] } : {}),
        }),
      }
    );

    // If member already in guild, just add role
    if (joinRes.status === 204 && server?.verify_role_id) {
      await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}/roles/${server.verify_role_id}`,
        {
          method: "PUT",
          headers: { Authorization: `Bot ${botToken}` },
        }
      );
    }

    // 8. Update server verified count
    if (server) {
      const { count } = await supabase
        .from("verified_members")
        .select("*", { count: "exact", head: true })
        .eq("guild_id", guildId);

      await supabase
        .from("servers")
        .update({ verified_count: count || 0 })
        .eq("guild_id", guildId);
    }

    // 9. Send webhook log
    if (server?.verify_logs && server?.webhook_url) {
      const embed = {
        title: "✅ New Verification",
        color: 0x6366f1,
        fields: [
          { name: "User", value: `${username} (<@${discordId}>)`, inline: true },
          { name: "ID", value: discordId, inline: true },
          ...(isAlt && server.alt_notify
            ? [{ name: "⚠️ Alt Detection", value: `Matching IP with: ${existingByIp?.map(m => m.username).join(", ")}`, inline: false }]
            : []),
        ],
        timestamp: new Date().toISOString(),
      };

      await fetch(server.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
      }).catch(e => console.error("Webhook error:", e));
    }

    // 10. Redirect to success
    return Response.redirect(`${frontendUrl}/verify/${slug}?success=true`, 302);

  } catch (error) {
    console.error("Callback error:", error);
    return Response.redirect(`${frontendUrl}/verify/${slug}?error=unknown`, 302);
  }
});
