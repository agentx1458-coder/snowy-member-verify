
-- Servers the bot is configured for
CREATE TABLE public.servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT,
  slug TEXT NOT NULL UNIQUE,
  verify_role_id TEXT,
  webhook_url TEXT,
  alt_blocking BOOLEAN NOT NULL DEFAULT true,
  alt_notify BOOLEAN NOT NULL DEFAULT true,
  verify_logs BOOLEAN NOT NULL DEFAULT true,
  member_count INTEGER NOT NULL DEFAULT 0,
  verified_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Verified members
CREATE TABLE public.verified_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL,
  discord_id TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  ip_address TEXT,
  is_alt BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'verified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(guild_id, discord_id)
);

-- Enable RLS
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_members ENABLE ROW LEVEL SECURITY;

-- No public access - all access through edge functions with service role
-- We still add a select policy for edge functions querying via service role (bypasses RLS anyway)
-- These tables have no user_id since auth is password-based, not Supabase auth
