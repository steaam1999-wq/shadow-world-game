-- Искра: схема базы для Supabase.
-- Выполните целиком в Supabase → SQL Editor → New query → Run. Повторный запуск безопасен.

-- Профили людей. id совпадает с аккаунтом Supabase Auth.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  age int not null check (age between 18 and 99),
  bio text not null default '' check (char_length(bio) <= 500),
  district text not null default '',
  hue int not null default 12,
  tags text[] not null default '{}',
  answers jsonb not null default '{}',
  photo text check (photo is null or char_length(photo) <= 400000),
  verified boolean not null default false,
  meetings int not null default 0,
  created_at timestamptz not null default now()
);

-- Планы: видны всем вошедшим. Точное место хранится отдельно (plan_secrets).
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  category text not null,
  area text not null,
  starts_at timestamptz not null,
  duration_min int not null default 90,
  expires_at timestamptz not null,
  x real not null default 50,
  y real not null default 50,
  photo text check (photo is null or char_length(photo) <= 400000),
  time_hidden boolean not null default false,
  group_size int check (group_size is null or group_size between 3 and 4),
  created_at timestamptz not null default now()
);
create index if not exists plans_expires_idx on public.plans (expires_at);
create index if not exists plans_author_idx on public.plans (author);

-- Капсула: переписка двух людей, 72 часа на договорённость. С планом — отклик на него,
-- без плана (plan_id null) — личное сообщение из профиля.
create table if not exists public.capsules (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.plans (id) on delete cascade,
  author uuid not null references public.profiles (id) on delete cascade,
  responder uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'agreed', 'contacts', 'met')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '72 hours',
  unique (plan_id, responder),
  check (author <> responder)
);
-- Для баз, созданных до личных сообщений.
alter table public.capsules alter column plan_id drop not null;
-- Одна личная переписка на пару людей, кто бы ни написал первым.
create unique index if not exists capsules_direct_pair on public.capsules (least(author, responder), greatest(author, responder)) where plan_id is null;
create index if not exists capsules_author_idx on public.capsules (author);
create index if not exists capsules_responder_idx on public.capsules (responder);

-- Точное место встречи: видит автор и те, у кого есть капсула по этому плану.
create table if not exists public.plan_secrets (
  plan_id uuid primary key references public.plans (id) on delete cascade,
  exact_place text not null default '' check (char_length(exact_place) <= 120)
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  capsule_id uuid not null references public.capsules (id) on delete cascade,
  sender uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_capsule_idx on public.messages (capsule_id, created_at);
create index if not exists messages_sender_idx on public.messages (sender);

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists reports_reporter_idx on public.reports (reporter);
create index if not exists reports_target_idx on public.reports (target);

-- Участник ли текущий пользователь капсулы. security definer — чтобы политики не зацикливались.
-- Живёт в закрытой схеме private: через API её не вызвать.
create schema if not exists private;
grant usage on schema private to authenticated;
create or replace function private.in_capsule(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.capsules where id = c and (select auth.uid()) in (author, responder))
$$;
revoke all on function private.in_capsule(uuid) from public, anon;
grant execute on function private.in_capsule(uuid) to authenticated;
drop function if exists public.in_capsule(uuid);

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.capsules enable row level security;
alter table public.plan_secrets enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

drop policy if exists "profiles: read" on public.profiles;
create policy "profiles: read" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles: own insert" on public.profiles;
create policy "profiles: own insert" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists "profiles: own update" on public.profiles;
create policy "profiles: own update" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "plans: read" on public.plans;
create policy "plans: read" on public.plans for select to authenticated using (true);
drop policy if exists "plans: own insert" on public.plans;
create policy "plans: own insert" on public.plans for insert to authenticated with check (author = (select auth.uid()));
drop policy if exists "plans: own delete" on public.plans;
create policy "plans: own delete" on public.plans for delete to authenticated using (author = (select auth.uid()));

drop policy if exists "secrets: author" on public.plan_secrets;
drop policy if exists "secrets: matched" on public.plan_secrets;
drop policy if exists "secrets: read" on public.plan_secrets;
create policy "secrets: read" on public.plan_secrets for select to authenticated using (
  exists (select 1 from plans p where p.id = plan_id and p.author = (select auth.uid()))
  or exists (select 1 from capsules c where c.plan_id = plan_secrets.plan_id and c.responder = (select auth.uid()))
);
drop policy if exists "secrets: author insert" on public.plan_secrets;
create policy "secrets: author insert" on public.plan_secrets for insert to authenticated
  with check (exists (select 1 from plans p where p.id = plan_id and p.author = (select auth.uid())));

drop policy if exists "capsules: participants read" on public.capsules;
create policy "capsules: participants read" on public.capsules for select to authenticated using ((select auth.uid()) in (author, responder));
drop policy if exists "capsules: respond" on public.capsules;
drop policy if exists "capsules: open" on public.capsules;
create policy "capsules: open" on public.capsules for insert to authenticated with check (
  responder = (select auth.uid()) and author <> responder and (
    (plan_id is not null and author = (select p.author from plans p where p.id = plan_id and p.expires_at > now()))
    or (plan_id is null and exists (select 1 from profiles pr where pr.id = author))
  )
);
drop policy if exists "capsules: participants update" on public.capsules;
create policy "capsules: participants update" on public.capsules for update to authenticated
  using ((select auth.uid()) in (author, responder)) with check ((select auth.uid()) in (author, responder));
-- Менять в капсуле можно только статус и срок: остальные поля защищены.
revoke update on public.capsules from authenticated;
grant update (status, expires_at) on public.capsules to authenticated;

drop policy if exists "messages: participants read" on public.messages;
create policy "messages: participants read" on public.messages for select to authenticated using (private.in_capsule(capsule_id));
drop policy if exists "messages: participants send" on public.messages;
create policy "messages: participants send" on public.messages for insert to authenticated
  with check (sender = (select auth.uid()) and private.in_capsule(capsule_id));

drop policy if exists "reports: send" on public.reports;
create policy "reports: send" on public.reports for insert to authenticated with check (reporter = (select auth.uid()));

-- ===== Безопасность сообщества: администраторы, баны, блокировки, удаление аккаунта =====

-- Профиль: менять можно только свои «анкетные» поля. verified ставит только сервер/админ.
revoke insert, update on public.profiles from authenticated;
grant insert (id, name, age, bio, district, hue, tags, answers, photo, meetings) on public.profiles to authenticated;
grant update (id, name, age, bio, district, hue, tags, answers, photo, meetings) on public.profiles to authenticated;

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;
drop policy if exists "admins: self read" on public.admins;
create policy "admins: self read" on public.admins for select to authenticated using (user_id = (select auth.uid()));

create table if not exists public.bans (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now()
);
alter table public.bans enable row level security;

-- Блокировка: заблокированный не может написать и не виден тому, кто заблокировал.
create table if not exists public.blocks (
  blocker uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);
create index if not exists blocks_blocked_idx on public.blocks (blocked);
alter table public.blocks enable row level security;
drop policy if exists "blocks: own read" on public.blocks;
create policy "blocks: own read" on public.blocks for select to authenticated using (blocker = (select auth.uid()));
drop policy if exists "blocks: own add" on public.blocks;
create policy "blocks: own add" on public.blocks for insert to authenticated with check (blocker = (select auth.uid()));
drop policy if exists "blocks: own remove" on public.blocks;
create policy "blocks: own remove" on public.blocks for delete to authenticated using (blocker = (select auth.uid()));

alter table public.reports add column if not exists status text not null default 'open' check (status in ('open', 'resolved'));

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()))
$$;
create or replace function private.is_banned(u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.bans where user_id = u)
$$;
create or replace function private.blocked_between(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks where (blocker = a and blocked = b) or (blocker = b and blocked = a))
$$;
-- Писать в капсулу: участник, не забанен, никто из двоих не заблокировал другого.
create or replace function private.can_write(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.capsules x
    where x.id = c and (select auth.uid()) in (x.author, x.responder)
      and not exists (select 1 from public.blocks b where (b.blocker = x.author and b.blocked = x.responder) or (b.blocker = x.responder and b.blocked = x.author))
      and not exists (select 1 from public.bans where user_id = (select auth.uid()))
  )
$$;
revoke all on function private.is_admin(), private.is_banned(uuid), private.blocked_between(uuid, uuid), private.can_write(uuid) from public, anon;
grant execute on function private.is_admin(), private.is_banned(uuid), private.blocked_between(uuid, uuid), private.can_write(uuid) to authenticated;

drop policy if exists "bans: admin read" on public.bans;
create policy "bans: admin read" on public.bans for select to authenticated using (private.is_admin());
drop policy if exists "bans: admin add" on public.bans;
create policy "bans: admin add" on public.bans for insert to authenticated with check (private.is_admin());
drop policy if exists "bans: admin remove" on public.bans;
create policy "bans: admin remove" on public.bans for delete to authenticated using (private.is_admin());

drop policy if exists "reports: admin read" on public.reports;
create policy "reports: admin read" on public.reports for select to authenticated using (private.is_admin());
drop policy if exists "reports: admin update" on public.reports;
create policy "reports: admin update" on public.reports for update to authenticated using (private.is_admin()) with check (private.is_admin());

-- Забаненных не видно (кроме себя и админа); писать и публиковать им нельзя.
drop policy if exists "profiles: read" on public.profiles;
create policy "profiles: read" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or not private.is_banned(id) or private.is_admin());
drop policy if exists "plans: read" on public.plans;
create policy "plans: read" on public.plans for select to authenticated
  using (author = (select auth.uid()) or not private.is_banned(author) or private.is_admin());
drop policy if exists "plans: own insert" on public.plans;
create policy "plans: own insert" on public.plans for insert to authenticated
  with check (author = (select auth.uid()) and not private.is_banned((select auth.uid())));
drop policy if exists "capsules: open" on public.capsules;
create policy "capsules: open" on public.capsules for insert to authenticated with check (
  responder = (select auth.uid()) and author <> responder
  and not private.is_banned((select auth.uid())) and not private.blocked_between(author, responder) and (
    (plan_id is not null and author = (select p.author from plans p where p.id = plan_id and p.expires_at > now()))
    or (plan_id is null and exists (select 1 from profiles pr where pr.id = author))
  )
);
drop policy if exists "messages: participants send" on public.messages;
create policy "messages: participants send" on public.messages for insert to authenticated
  with check (sender = (select auth.uid()) and private.can_write(capsule_id));

-- Верификация: селфи с жестом видит только модератор; решение ставит галочку в профиле,
-- а фото сразу удаляется. Одобрить может только администратор.
create table if not exists public.verification_requests (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  photo text check (photo is null or char_length(photo) <= 600000),
  gesture text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
alter table public.verification_requests enable row level security;
drop policy if exists "verif: read" on public.verification_requests;
create policy "verif: read" on public.verification_requests for select to authenticated
  using (user_id = (select auth.uid()) or private.is_admin());
drop policy if exists "verif: submit" on public.verification_requests;
create policy "verif: submit" on public.verification_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');
drop policy if exists "verif: update" on public.verification_requests;
create policy "verif: update" on public.verification_requests for update to authenticated
  using (user_id = (select auth.uid()) or private.is_admin())
  with check ((user_id = (select auth.uid()) and status = 'pending') or private.is_admin());

create or replace function private.on_verification_decided() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
    update public.profiles set verified = (new.status = 'approved') where id = new.user_id;
    new.photo := null;
    new.decided_at := now();
  end if;
  return new;
end $$;
revoke all on function private.on_verification_decided() from public, anon, authenticated;
drop trigger if exists verification_decided on public.verification_requests;
create trigger verification_decided before update on public.verification_requests
  for each row execute function private.on_verification_decided();

-- Удаление своего аккаунта со всеми данными (профиль, планы, переписка удаляются каскадом).
create or replace function public.delete_my_account() returns void
language sql security definer set search_path = public as $$
  delete from auth.users where id = (select auth.uid())
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Живые обновления чата, капсул, ленты и новых людей.
do $$
begin
  begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.capsules; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.plans; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.profiles; exception when duplicate_object then null; end;
end $$;
