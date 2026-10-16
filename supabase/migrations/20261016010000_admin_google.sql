-- Le compte smithcharles8484@gmail.com devient admin dès la première connexion Google.
-- Les autres comptes restent is_admin = false.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin boolean := lower(coalesce(new.email, '')) = 'smithcharles8484@gmail.com';
begin
  insert into public.profiles (id, email, is_admin)
  values (new.id, new.email, admin)
  on conflict (id) do update
    set email = excluded.email,
        is_admin = public.profiles.is_admin or excluded.is_admin;
  return new;
end;
$$;

update public.profiles
set is_admin = true
where lower(email) = 'smithcharles8484@gmail.com';
