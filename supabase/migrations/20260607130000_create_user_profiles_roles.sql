-- Per-user app profile holding role + email for the admin dashboard.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'client' check (role in ('admin','client')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- security-definer helper so server code can fetch a role without RLS recursion
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Admins can read every profile (used by the admin dashboard).
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select using (public.current_user_role() = 'admin');

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill existing users as clients.
insert into public.profiles (id, email, role)
select id, email, 'client' from auth.users
on conflict (id) do nothing;

-- Promote the owner account to admin.
update public.profiles set role = 'admin' where email = 'mo@darkmattr.co';
