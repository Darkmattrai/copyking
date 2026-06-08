-- Per-call Anthropic token usage log, powering the admin "token usage & cost"
-- view. One row per Claude API call (ICP generate/chat, offer enhance/chat).
-- Written only by server routes via the service-role client; cost is computed
-- on read from a pricing table in app code, so rates stay adjustable.
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  feature text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_creation_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.usage_events enable row level security;

create index if not exists usage_events_user_id_idx
  on public.usage_events (user_id);

create index if not exists usage_events_created_at_idx
  on public.usage_events (created_at);

-- No client-facing policies: only the service-role admin client (which bypasses
-- RLS) reads/writes this table. Keeping RLS on with no policies blocks all
-- access via the anon/auth keys.
