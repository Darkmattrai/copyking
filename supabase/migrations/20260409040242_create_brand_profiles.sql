create extension if not exists pgcrypto;

create table if not exists public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_key text unique not null,
  brand_dna jsonb not null,
  interview_completed boolean not null default false,
  reveal_seen boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brand_profiles enable row level security;

create index if not exists brand_profiles_profile_key_idx
  on public.brand_profiles (profile_key);
