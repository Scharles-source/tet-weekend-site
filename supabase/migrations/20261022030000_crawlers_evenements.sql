-- Crawlers d'événements. watch_accounts existe déjà (colonnes plateforme, url, type, actif).
-- On ajoute les champs manquants. On ne recrée pas collecte_jobs (menus, autre branche, autres statuts).
-- anon : aucun accès. authenticated : admin via est_admin(). service_role : runner local uniquement.

alter table public.watch_accounts drop constraint if exists watch_accounts_plateforme_check;
alter table public.watch_accounts add constraint watch_accounts_plateforme_check
  check (plateforme in ('instagram', 'facebook', 'eventbrite', 'website', 'rss', 'manual'));

alter table public.watch_accounts drop constraint if exists watch_accounts_type_check;
alter table public.watch_accounts add constraint watch_accounts_type_check
  check (type in ('lieu', 'artiste', 'promoteur', 'media', 'organisateur', 'autre'));

alter table public.watch_accounts
  add column if not exists display_name text,
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists scan_frequency_minutes integer not null default 1440,
  add column if not exists max_posts_per_scan integer not null default 20,
  add column if not exists last_scanned_at timestamptz,
  add column if not exists last_success_at timestamptz,
  add column if not exists last_status text,
  add column if not exists last_error text,
  add column if not exists notes text,
  add column if not exists source_key text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.watch_accounts drop constraint if exists watch_accounts_frequence_check;
alter table public.watch_accounts add constraint watch_accounts_frequence_check
  check (scan_frequency_minutes >= 0 and scan_frequency_minutes <= 10080);

alter table public.watch_accounts drop constraint if exists watch_accounts_max_posts_check;
alter table public.watch_accounts add constraint watch_accounts_max_posts_check
  check (max_posts_per_scan between 1 and 50);

create or replace function public.watch_accounts_source_key()
returns trigger
language plpgsql
as $$
begin
  new.source_key := lower(new.plateforme) || ':' || lower(
    regexp_replace(
      coalesce(nullif(btrim(coalesce(new.handle, '')), ''), nullif(btrim(coalesce(new.url, '')), ''), ''),
      '^@+', ''
    )
  );
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists watch_accounts_source_key on public.watch_accounts;
create trigger watch_accounts_source_key
  before insert or update on public.watch_accounts
  for each row execute function public.watch_accounts_source_key();

update public.watch_accounts
set handle = handle
where source_key is null;

create unique index if not exists watch_accounts_active_source_idx
  on public.watch_accounts (source_key)
  where actif and source_key is not null and split_part(source_key, ':', 2) <> '';

-- ───────────────────────────── crawler_settings ─────────────────────────────
create table if not exists public.crawler_settings (
  id boolean primary key default true check (id),
  global_enabled boolean not null default true,
  scheduler_enabled boolean not null default false,
  default_frequency_minutes integer not null default 1440,
  max_posts_per_source integer not null default 20,
  max_concurrent_jobs integer not null default 1,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

insert into public.crawler_settings (id) values (true) on conflict (id) do nothing;

-- ───────────────────────────── crawler_runner ─────────────────────────────
-- Une ligne, comme l'ancien collecte_runner : le battement existe même sans job.
create table if not exists public.crawler_runner (
  id integer primary key check (id = 1),
  runner_id text,
  heartbeat_at timestamptz,
  version text
);

insert into public.crawler_runner (id) values (1) on conflict (id) do nothing;

-- ───────────────────────────── crawl_jobs ─────────────────────────────
create table if not exists public.crawl_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null check (job_type in ('scan_source', 'scan_all', 'import_url', 'retry_failed')),
  source_id uuid references public.watch_accounts (id) on delete set null,
  input_url text,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'paused', 'succeeded', 'failed', 'cancelled', 'blocked')),
  requested_by uuid,
  scheduled_for timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  heartbeat_at timestamptz,
  runner_id text,
  cancel_requested boolean not null default false,
  attempt integer not null default 0,
  counts jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crawl_jobs_file_idx
  on public.crawl_jobs (status, scheduled_for, created_at);

-- ───────────────────────────── crawl_job_logs ─────────────────────────────
create table if not exists public.crawl_job_logs (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.crawl_jobs (id) on delete cascade,
  level text not null check (level in ('info', 'warn', 'error')),
  message text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists crawl_job_logs_job_idx on public.crawl_job_logs (job_id, created_at);

-- ───────────────────────────── event_candidates ─────────────────────────────
create table if not exists public.event_candidates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.crawl_jobs (id) on delete set null,
  source_id uuid references public.watch_accounts (id) on delete set null,
  platform text not null,
  source_post_id text,
  source_post_url text not null,
  caption text,
  flyer_storage_path text,
  flyer_url text,
  flyer_width integer,
  flyer_height integer,
  media_sha256 text,
  title text,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text,
  venue_name text,
  venue_id uuid,
  city text,
  country text,
  artists_text text,
  price_text text,
  is_free boolean,
  category text,
  description text,
  confidence jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  status text not null default 'needs_review'
    check (status in ('needs_review', 'approved', 'rejected', 'duplicate', 'imported')),
  duplicate_of_event_id uuid,
  duplicate_of_candidate_id uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_candidates_payload_taille check (octet_length(raw_payload::text) <= 8000)
);

create unique index if not exists event_candidates_post_idx
  on public.event_candidates (platform, source_post_id)
  where source_post_id is not null;

create unique index if not exists event_candidates_url_idx
  on public.event_candidates (platform, source_post_url);

create index if not exists event_candidates_status_idx
  on public.event_candidates (status, created_at desc);

create index if not exists event_candidates_source_idx on public.event_candidates (source_id);
create index if not exists event_candidates_sha_idx on public.event_candidates (media_sha256);

-- ───────────────────────────── RPC ─────────────────────────────
create or replace function public.claim_crawl_job(p_runner_id text)
returns setof public.crawl_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_runner_id is null or p_runner_id !~ '^[A-Za-z0-9-]{8,80}$' then
    raise exception 'runner invalide';
  end if;
  if not exists (select 1 from public.crawler_settings where id and global_enabled) then
    return;
  end if;
  return query
  with next as (
    select id
    from public.crawl_jobs
    where status = 'queued' and scheduled_for <= now()
    order by scheduled_for asc, created_at asc
    for update skip locked
    limit 1
  )
  update public.crawl_jobs as job
  set status = 'running',
      started_at = coalesce(job.started_at, now()),
      heartbeat_at = now(),
      runner_id = p_runner_id,
      attempt = job.attempt + 1,
      updated_at = now()
  from next
  where job.id = next.id
  returning job.*;
end;
$$;

create or replace function public.crawler_heartbeat(p_runner_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_runner_id is null or p_runner_id !~ '^[A-Za-z0-9-]{8,80}$' then
    raise exception 'runner invalide';
  end if;
  update public.crawler_runner
  set runner_id = p_runner_id, heartbeat_at = now()
  where id = 1;
  update public.crawl_jobs
  set heartbeat_at = now(), updated_at = now()
  where runner_id = p_runner_id and status = 'running';
end;
$$;

revoke all on function public.claim_crawl_job(text) from public, anon, authenticated;
revoke all on function public.crawler_heartbeat(text) from public, anon, authenticated;
grant execute on function public.claim_crawl_job(text) to service_role;
grant execute on function public.crawler_heartbeat(text) to service_role;

-- ───────────────────────────── Grants ─────────────────────────────
revoke all on public.crawler_settings from anon, authenticated;
revoke all on public.crawler_runner from anon, authenticated;
revoke all on public.crawl_jobs from anon, authenticated;
revoke all on public.crawl_job_logs from anon, authenticated;
revoke all on public.event_candidates from anon, authenticated;

grant select, update on public.crawler_settings to authenticated;
grant select on public.crawler_runner to authenticated;
grant select, insert, update on public.crawl_jobs to authenticated;
grant select on public.crawl_job_logs to authenticated;
grant select, insert, update on public.event_candidates to authenticated;

grant all privileges on public.crawler_settings to service_role;
grant all privileges on public.crawler_runner to service_role;
grant all privileges on public.crawl_jobs to service_role;
grant all privileges on public.crawl_job_logs to service_role;
grant all privileges on public.event_candidates to service_role;
grant usage, select on sequence public.crawl_job_logs_id_seq to service_role;

-- ───────────────────────────── RLS ─────────────────────────────
alter table public.crawler_settings enable row level security;
alter table public.crawler_runner enable row level security;
alter table public.crawl_jobs enable row level security;
alter table public.crawl_job_logs enable row level security;
alter table public.event_candidates enable row level security;

drop policy if exists crawler_settings_admin on public.crawler_settings;
create policy crawler_settings_admin on public.crawler_settings
  for all to authenticated
  using (public.est_admin())
  with check (public.est_admin());

drop policy if exists crawler_runner_admin_select on public.crawler_runner;
create policy crawler_runner_admin_select on public.crawler_runner
  for select to authenticated
  using (public.est_admin());

drop policy if exists crawl_jobs_admin on public.crawl_jobs;
create policy crawl_jobs_admin on public.crawl_jobs
  for all to authenticated
  using (public.est_admin())
  with check (public.est_admin());

drop policy if exists crawl_job_logs_admin_select on public.crawl_job_logs;
create policy crawl_job_logs_admin_select on public.crawl_job_logs
  for select to authenticated
  using (public.est_admin());

drop policy if exists event_candidates_admin on public.event_candidates;
create policy event_candidates_admin on public.event_candidates
  for all to authenticated
  using (public.est_admin())
  with check (public.est_admin());

-- ───────────────────────────── Bucket privé des flyers candidats ─────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-candidate-flyers',
  'event-candidate-flyers',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists event_candidate_flyers_admin_select on storage.objects;
create policy event_candidate_flyers_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'event-candidate-flyers' and public.est_admin());

drop policy if exists event_candidate_flyers_admin_insert on storage.objects;
create policy event_candidate_flyers_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-candidate-flyers' and public.est_admin());

drop policy if exists event_candidate_flyers_admin_delete on storage.objects;
create policy event_candidate_flyers_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-candidate-flyers' and public.est_admin());

notify pgrst, 'reload schema';
