-- Stores a user's connected Instagram account + Meta access tokens.
-- Tokens must NEVER reach the browser: RLS is enabled with NO policies, so only
-- the service-role client (server-side) can read/write this table. The client
-- learns connection status (connected? @username?) via a server API route, never
-- by selecting this table directly.

create table if not exists public.instagram_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ig_user_id text not null,
  ig_username text,
  page_id text,
  page_name text,
  -- Long-lived Meta user token + the Page access token used for IG Graph calls.
  user_access_token text not null,
  page_access_token text,
  token_expires_at timestamptz,
  scopes text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.instagram_connections enable row level security;
-- Intentionally no policies → only service_role (which bypasses RLS) can touch it.
