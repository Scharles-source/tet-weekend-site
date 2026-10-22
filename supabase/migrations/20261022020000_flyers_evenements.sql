-- Flyers d'événements. source et source_url existent déjà :
-- source = plateforme (instagram, facebook, eventbrite, manuel)
-- source_url = URL du post d'origine
-- On n'ajoute pas source_platform ni source_post_url.

alter table public.events drop constraint if exists events_categorie_check;
alter table public.events add constraint events_categorie_check
  check (categorie is null or categorie in ('bals', 'concerts', 'soirees-kompa', 'festivals', 'autre'));

alter table public.events
  add column if not exists flyer_storage_path text,
  add column if not exists flyer_url text,
  add column if not exists flyer_card_url text,
  add column if not exists flyer_width integer,
  add column if not exists flyer_height integer,
  add column if not exists flyer_mime_type text,
  add column if not exists flyer_alt text,
  add column if not exists flyer_credit text,
  add column if not exists flyer_hidden_at timestamptz,
  add column if not exists flyer_hidden_reason text,
  add column if not exists source_account text,
  add column if not exists spotted_at timestamptz;

alter table public.events drop constraint if exists events_flyer_mime_type_check;
alter table public.events add constraint events_flyer_mime_type_check
  check (flyer_mime_type is null or flyer_mime_type in ('image/jpeg', 'image/png', 'image/webp'));

alter table public.events drop constraint if exists events_flyer_width_check;
alter table public.events add constraint events_flyer_width_check
  check (flyer_width is null or flyer_width > 0);

alter table public.events drop constraint if exists events_flyer_height_check;
alter table public.events add constraint events_flyer_height_check
  check (flyer_height is null or flyer_height > 0);

-- anon lit les colonnes d'affichage. Le masquage efface flyer_url, donc l'URL
-- publique disparaît sans exposer le chemin storage ni le motif.
grant select (
  flyer_url, flyer_card_url, flyer_width, flyer_height, flyer_mime_type,
  flyer_alt, flyer_credit, source_account
) on public.events to anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-flyers',
  'event-flyers',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists event_flyers_lecture on storage.objects;
create policy event_flyers_lecture on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'event-flyers');

drop policy if exists event_flyers_admin_insert on storage.objects;
create policy event_flyers_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-flyers' and public.est_admin());

drop policy if exists event_flyers_admin_update on storage.objects;
create policy event_flyers_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'event-flyers' and public.est_admin())
  with check (bucket_id = 'event-flyers' and public.est_admin());

drop policy if exists event_flyers_admin_delete on storage.objects;
create policy event_flyers_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-flyers' and public.est_admin());

notify pgrst, 'reload schema';
