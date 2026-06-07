-- Auto-assign admin role to the owner allowlist on signup (e.g. first Google
-- sign-in), everyone else defaults to client.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case
      when lower(new.email) in ('mo@darkmattr.co', 'aal@darkmattr.co') then 'admin'
      else 'client'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Promote both owner accounts if they already exist.
update public.profiles
set role = 'admin'
where lower(email) in ('mo@darkmattr.co', 'aal@darkmattr.co');
