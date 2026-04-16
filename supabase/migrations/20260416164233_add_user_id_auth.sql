alter table public.brand_profiles
  add column user_id uuid references auth.users(id);

create unique index brand_profiles_user_id_idx
  on public.brand_profiles (user_id);

create policy "Users can read own profile"
  on public.brand_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.brand_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.brand_profiles for update
  using (auth.uid() = user_id);
