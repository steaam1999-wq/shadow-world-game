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

-- Сохранённые песни в профиле: другие видят, что человек слушает (только ссылки на онлайн-треки).
alter table public.profiles add column if not exists songs jsonb not null default '[]';
alter table public.profiles drop constraint if exists profiles_songs_check;
alter table public.profiles add constraint profiles_songs_check
  check (jsonb_typeof(songs) = 'array' and jsonb_array_length(songs) <= 50 and octet_length(songs::text) <= 60000);

-- «Сейчас слушает»: трек, который играет у человека прямо сейчас (null — ничего не играет).
alter table public.profiles add column if not exists now_playing jsonb;
alter table public.profiles drop constraint if exists profiles_now_playing_check;
alter table public.profiles add constraint profiles_now_playing_check
  check (now_playing is null or (jsonb_typeof(now_playing) = 'object' and octet_length(now_playing::text) <= 4000));

-- Фото профиля в хранилище media/<владелец>/<файл>; в photo остаются только старые фото (base64).
alter table public.profiles add column if not exists photo_path text check (photo_path is null or char_length(photo_path) <= 200);

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
alter table public.plans add column if not exists photo_path text check (photo_path is null or char_length(photo_path) <= 200);
-- Музыка к плану: трек из интернета и начало 15-секундного отрывка.
alter table public.plans add column if not exists music jsonb;
alter table public.plans drop constraint if exists plans_music_check;
alter table public.plans add constraint plans_music_check
  check (music is null or (jsonb_typeof(music) = 'object' and octet_length(music::text) <= 4000));

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
grant insert (id, name, age, bio, district, hue, tags, answers, photo, meetings, songs, now_playing, photo_path) on public.profiles to authenticated;
grant update (id, name, age, bio, district, hue, tags, answers, photo, meetings, songs, now_playing, photo_path) on public.profiles to authenticated;
-- Когда человек подтвердил 18+ и дал согласие на обработку персональных данных.
alter table public.profiles add column if not exists consent_at timestamptz;
grant insert (consent_at), update (consent_at) on public.profiles to authenticated;

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

-- Комментарии под планами: видны всем вошедшим; пишет только сам автор, если не забанен
-- и автор плана его не блокировал. Удалить может автор комментария, автор плана или модератор.
create table if not exists public.plan_comments (
  id bigint generated always as identity primary key,
  plan_id uuid not null references public.plans (id) on delete cascade,
  author uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists plan_comments_plan_idx on public.plan_comments (plan_id, created_at);
create index if not exists plan_comments_author_idx on public.plan_comments (author);
-- Ответ на другой комментарий того же плана (удаляется вместе с ним).
alter table public.plan_comments add column if not exists reply_to bigint references public.plan_comments (id) on delete cascade;
create index if not exists plan_comments_reply_idx on public.plan_comments (reply_to);
alter table public.plan_comments enable row level security;
drop policy if exists "comments: read" on public.plan_comments;
create policy "comments: read" on public.plan_comments for select to authenticated
  using (author = (select auth.uid()) or not private.is_banned(author) or private.is_admin());
drop policy if exists "comments: write" on public.plan_comments;
create policy "comments: write" on public.plan_comments for insert to authenticated with check (
  author = (select auth.uid()) and not private.is_banned((select auth.uid()))
  and exists (select 1 from plans p where p.id = plan_id and not private.blocked_between(p.author, (select auth.uid())))
  and reply_to is null -- ответы разрешаются ниже, после функции private.can_reply_plan
);
drop policy if exists "comments: delete" on public.plan_comments;
create policy "comments: delete" on public.plan_comments for delete to authenticated using (
  author = (select auth.uid()) or private.is_admin()
  or exists (select 1 from plans p where p.id = plan_id and p.author = (select auth.uid()))
);

-- Публикации: шортсы (короткие вертикальные видео) и посты с фото на главной. Файл лежит в закрытом хранилище shorts/<автор>/<файл>,
-- смотреть могут только вошедшие пользователи.
create table if not exists public.shorts (
  id uuid primary key default gen_random_uuid(),
  author uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  path text not null check (char_length(path) <= 200),
  caption text not null default '' check (char_length(caption) <= 200),
  duration real,
  created_at timestamptz not null default now()
);
alter table public.shorts add column if not exists kind text not null default 'video';
alter table public.shorts drop constraint if exists shorts_kind_check;
alter table public.shorts add constraint shorts_kind_check check (kind in ('video', 'photo'));
create index if not exists shorts_author_idx on public.shorts (author);
create index if not exists shorts_created_idx on public.shorts (created_at desc);
alter table public.shorts enable row level security;
revoke all on public.shorts from anon, authenticated;
grant select, delete on public.shorts to authenticated;
alter table public.shorts add column if not exists thumb_path text check (char_length(thumb_path) <= 200); -- кадр-превью видео (JPEG)
grant insert (path, caption, duration, kind, thumb_path) on public.shorts to authenticated;
grant update (thumb_path) on public.shorts to authenticated;
drop policy if exists "shorts: read" on public.shorts;
create policy "shorts: read" on public.shorts for select to authenticated
  using (author = (select auth.uid()) or private.is_admin() or (not private.is_banned(author) and not private.blocked_between(author, (select auth.uid()))));
drop policy if exists "shorts: add own" on public.shorts;
create policy "shorts: add own" on public.shorts for insert to authenticated with check (
  author = (select auth.uid()) and not private.is_banned((select auth.uid()))
  and path like (select auth.uid())::text || '/%'
  and (thumb_path is null or thumb_path like (select auth.uid())::text || '/%')
);
-- Автор может досоздать превью для старого видео.
drop policy if exists "shorts: set own thumb" on public.shorts;
create policy "shorts: set own thumb" on public.shorts for update to authenticated
  using (author = (select auth.uid()))
  with check (author = (select auth.uid()) and (thumb_path is null or thumb_path like (select auth.uid())::text || '/%'));
drop policy if exists "shorts: delete" on public.shorts;
create policy "shorts: delete" on public.shorts for delete to authenticated using (author = (select auth.uid()) or private.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shorts', 'shorts', false, 52428800, array['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "shorts files: read" on storage.objects;
create policy "shorts files: read" on storage.objects for select to authenticated using (bucket_id = 'shorts');
drop policy if exists "shorts files: upload own" on storage.objects;
create policy "shorts files: upload own" on storage.objects for insert to authenticated with check (
  bucket_id = 'shorts' and (storage.foldername(name))[1] = (select auth.uid())::text and not private.is_banned((select auth.uid()))
);
drop policy if exists "shorts files: delete own" on storage.objects;
create policy "shorts files: delete own" on storage.objects for delete to authenticated using (
  bucket_id = 'shorts' and ((storage.foldername(name))[1] = (select auth.uid())::text or private.is_admin())
);

-- Лайки планов и публикаций, подписки и «Сохранённое» — на сервере.
create table if not exists public.plan_likes (
  plan_id uuid not null references public.plans (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);
create index if not exists plan_likes_user_idx on public.plan_likes (user_id);
create table if not exists public.short_likes (
  short_id uuid not null references public.shorts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (short_id, user_id)
);
create index if not exists short_likes_user_idx on public.short_likes (user_id);
create table if not exists public.follows (
  follower uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  followee uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, followee),
  check (follower <> followee)
);
create index if not exists follows_followee_idx on public.follows (followee);
create table if not exists public.saved_plans (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, plan_id)
);
create index if not exists saved_plans_plan_idx on public.saved_plans (plan_id);

alter table public.plan_likes enable row level security;
alter table public.short_likes enable row level security;
alter table public.follows enable row level security;
alter table public.saved_plans enable row level security;
revoke all on public.plan_likes, public.short_likes, public.follows, public.saved_plans from anon, authenticated;
grant select, delete on public.plan_likes, public.short_likes, public.follows, public.saved_plans to authenticated;
grant insert (plan_id) on public.plan_likes to authenticated;
grant insert (short_id) on public.short_likes to authenticated;
grant insert (followee) on public.follows to authenticated;
grant insert (plan_id) on public.saved_plans to authenticated;

drop policy if exists "plan likes: read" on public.plan_likes;
create policy "plan likes: read" on public.plan_likes for select to authenticated using (true);
drop policy if exists "plan likes: add own" on public.plan_likes;
create policy "plan likes: add own" on public.plan_likes for insert to authenticated with check (
  user_id = (select auth.uid()) and not private.is_banned((select auth.uid()))
  and exists (select 1 from public.plans p where p.id = plan_id and not private.blocked_between(p.author, (select auth.uid())))
);
drop policy if exists "plan likes: remove own" on public.plan_likes;
create policy "plan likes: remove own" on public.plan_likes for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "short likes: read" on public.short_likes;
create policy "short likes: read" on public.short_likes for select to authenticated using (true);
drop policy if exists "short likes: add own" on public.short_likes;
create policy "short likes: add own" on public.short_likes for insert to authenticated with check (
  user_id = (select auth.uid()) and not private.is_banned((select auth.uid()))
  and exists (select 1 from public.shorts s where s.id = short_id and not private.blocked_between(s.author, (select auth.uid())))
);
drop policy if exists "short likes: remove own" on public.short_likes;
create policy "short likes: remove own" on public.short_likes for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "follows: read" on public.follows;
create policy "follows: read" on public.follows for select to authenticated using (true);
drop policy if exists "follows: add own" on public.follows;
create policy "follows: add own" on public.follows for insert to authenticated with check (
  follower = (select auth.uid()) and not private.is_banned((select auth.uid())) and not private.blocked_between(followee, (select auth.uid()))
);
drop policy if exists "follows: remove own" on public.follows;
create policy "follows: remove own" on public.follows for delete to authenticated using (follower = (select auth.uid()));

drop policy if exists "saved: own" on public.saved_plans;
create policy "saved: own" on public.saved_plans for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Закрытое хранилище фото профилей и планов.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "media files: read" on storage.objects;
create policy "media files: read" on storage.objects for select to authenticated using (bucket_id = 'media');
drop policy if exists "media files: upload own" on storage.objects;
create policy "media files: upload own" on storage.objects for insert to authenticated with check (
  bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text and not private.is_banned((select auth.uid()))
);
drop policy if exists "media files: delete own" on storage.objects;
create policy "media files: delete own" on storage.objects for delete to authenticated using (
  bucket_id = 'media' and ((storage.foldername(name))[1] = (select auth.uid())::text or private.is_admin())
);

-- Push-уведомления о новых сообщениях, даже когда сайт закрыт.
-- Ключи хранятся в Vault (не в этом файле). Для нового проекта создайте их один раз:
--   select vault.create_secret('<VAPID private>', 'iskra_vapid_private');
--   select vault.create_secret('<VAPID public>',  'iskra_vapid_public');
--   select vault.create_secret('<случайная строка>', 'iskra_push_hook');
-- и разверните функцию supabase/functions/push (verify_jwt = false: она проверяет x-push-secret).
create extension if not exists pg_net with schema extensions;

create table if not exists public.push_subscriptions (
  endpoint text primary key check (char_length(endpoint) <= 1000),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
grant select, delete on public.push_subscriptions to authenticated;
grant insert (endpoint, p256dh, auth) on public.push_subscriptions to authenticated;
-- endpoint тоже: «вставить или обновить» (upsert) переписывает все поля, без этого подписка не сохранялась.
grant update (endpoint, p256dh, auth) on public.push_subscriptions to authenticated;
drop policy if exists "push: own" on public.push_subscriptions;
create policy "push: own" on public.push_subscriptions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Ключи для функции рассылки: вызывать может только сервер (service_role).
create or replace function public.push_config() returns json
language sql stable security definer set search_path = public, vault as $$
  select json_build_object(
    'public', (select decrypted_secret from vault.decrypted_secrets where name = 'iskra_vapid_public'),
    'private', (select decrypted_secret from vault.decrypted_secrets where name = 'iskra_vapid_private'),
    'hook', (select decrypted_secret from vault.decrypted_secrets where name = 'iskra_push_hook'))
$$;
revoke all on function public.push_config() from public, anon, authenticated;
grant execute on function public.push_config() to service_role;

-- Новое сообщение — просим функцию push разослать уведомление получателю (адрес — этого проекта).
create or replace function private.on_message_push() returns trigger
language plpgsql security definer set search_path = public, vault, extensions as $$
begin
  perform net.http_post(
    url := 'https://mrivbqkqdaxtvwcsljzu.supabase.co/functions/v1/push',
    body := json_build_object('message_id', new.id)::jsonb,
    headers := json_build_object('Content-Type', 'application/json',
      'x-push-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'iskra_push_hook'))::jsonb,
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  return new; -- уведомление не должно мешать отправке сообщения
end $$;
revoke all on function private.on_message_push() from public, anon, authenticated;
drop trigger if exists messages_push on public.messages;
create trigger messages_push after insert on public.messages for each row execute function private.on_message_push();

-- Чат: фото в сообщениях, «прочитано» и удаление своих сообщений.
alter table public.messages add column if not exists photo_path text check (photo_path is null or char_length(photo_path) <= 200);
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages add constraint messages_content_check
  check (char_length(body) <= 2000 and (char_length(body) >= 1 or photo_path is not null));
drop policy if exists "messages: delete own" on public.messages;
create policy "messages: delete own" on public.messages for delete to authenticated using (sender = (select auth.uid()));

-- Когда каждый участник последний раз открывал чат — для галочек «прочитано».
alter table public.capsules add column if not exists author_read_at timestamptz;
alter table public.capsules add column if not exists responder_read_at timestamptz;
create or replace function public.mark_read(c uuid) returns void
language sql security definer set search_path = public as $$
  update public.capsules set
    author_read_at = case when author = (select auth.uid()) then now() else author_read_at end,
    responder_read_at = case when responder = (select auth.uid()) then now() else responder_read_at end
  where id = c and (select auth.uid()) in (author, responder)
$$;
revoke all on function public.mark_read(uuid) from public, anon;
grant execute on function public.mark_read(uuid) to authenticated;

-- Фото из чатов: chat/<id чата>/<файл>, видят только двое участников.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat', 'chat', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "chat files: participants read" on storage.objects;
create policy "chat files: participants read" on storage.objects for select to authenticated using (
  bucket_id = 'chat' and private.in_capsule(((storage.foldername(name))[1])::uuid)
);
drop policy if exists "chat files: participants upload" on storage.objects;
create policy "chat files: participants upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'chat' and private.can_write(((storage.foldername(name))[1])::uuid)
);
drop policy if exists "chat files: delete own" on storage.objects;
create policy "chat files: delete own" on storage.objects for delete to authenticated using (
  bucket_id = 'chat' and owner_id = (select auth.uid())::text
);

-- Жалоба может указывать на конкретную публикацию (шортс или пост с фото).
alter table public.reports add column if not exists short_id uuid references public.shorts (id) on delete set null;
create index if not exists reports_short_idx on public.reports (short_id);

-- «Удалить чат» у себя: переписка скрывается, пока не придёт новое сообщение; у собеседника всё остаётся.
alter table public.capsules add column if not exists author_hidden_at timestamptz;
alter table public.capsules add column if not exists responder_hidden_at timestamptz;
create or replace function public.hide_chat(c uuid) returns void
language sql security definer set search_path = public as $$
  update public.capsules set
    author_hidden_at = case when author = (select auth.uid()) then now() else author_hidden_at end,
    responder_hidden_at = case when responder = (select auth.uid()) then now() else responder_hidden_at end
  where id = c and (select auth.uid()) in (author, responder)
$$;
revoke all on function public.hide_chat(uuid) from public, anon;
grant execute on function public.hide_chat(uuid) to authenticated;

-- Новая подписка — push тому, на кого подписались.
create or replace function private.on_follow_push() returns trigger
language plpgsql security definer set search_path = public, vault, extensions as $$
begin
  perform net.http_post(
    url := 'https://mrivbqkqdaxtvwcsljzu.supabase.co/functions/v1/push',
    body := json_build_object('follower', new.follower, 'followee', new.followee)::jsonb,
    headers := json_build_object('Content-Type', 'application/json',
      'x-push-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'iskra_push_hook'))::jsonb,
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  return new;
end $$;
revoke all on function private.on_follow_push() from public, anon, authenticated;
drop trigger if exists follows_push on public.follows;
create trigger follows_push after insert on public.follows for each row execute function private.on_follow_push();

-- Репосты планов: кто поделился планом (в чат, ссылкой или через телефон). Видят тот, кто поделился, и автор плана.
create table if not exists public.plan_shares (
  id bigint generated always as identity primary key,
  plan_id uuid not null references public.plans (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists plan_shares_plan_idx on public.plan_shares (plan_id);
create index if not exists plan_shares_user_idx on public.plan_shares (user_id);
alter table public.plan_shares enable row level security;
revoke all on public.plan_shares from anon, authenticated;
grant select on public.plan_shares to authenticated;
grant insert (plan_id) on public.plan_shares to authenticated;
drop policy if exists "shares: read" on public.plan_shares;
create policy "shares: read" on public.plan_shares for select to authenticated using (
  user_id = (select auth.uid()) or exists (select 1 from public.plans p where p.id = plan_id and p.author = (select auth.uid()))
);
drop policy if exists "shares: add own" on public.plan_shares;
create policy "shares: add own" on public.plan_shares for insert to authenticated with check (
  user_id = (select auth.uid()) and not private.is_banned((select auth.uid()))
  and exists (select 1 from public.plans p where p.id = plan_id and not private.blocked_between(p.author, (select auth.uid())))
);

-- Админ-панель: общие настройки приложения, статистика, управление пользователями и контентом.

-- Настройки для всех: объявление, категории планов, интересы, открыта ли регистрация.
create table if not exists public.app_settings (
  key text primary key check (key in ('announcement', 'categories', 'tags', 'registration_open')),
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
grant select on public.app_settings to authenticated;
grant insert, update, delete on public.app_settings to authenticated;
drop policy if exists "settings: read" on public.app_settings;
create policy "settings: read" on public.app_settings for select to authenticated using (true);
drop policy if exists "settings: admin write" on public.app_settings;
drop policy if exists "settings: admin insert" on public.app_settings;
drop policy if exists "settings: admin update" on public.app_settings;
drop policy if exists "settings: admin delete" on public.app_settings;
create policy "settings: admin insert" on public.app_settings for insert to authenticated with check (private.is_admin());
create policy "settings: admin update" on public.app_settings for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "settings: admin delete" on public.app_settings for delete to authenticated using (private.is_admin());

-- Регистрация закрыта — новые анкеты создать нельзя; у кого профиль уже есть, сохраняют его как обычно.
create or replace function private.can_create_profile() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()))
    or coalesce((select value = 'true'::jsonb or value = 'null'::jsonb from public.app_settings where key = 'registration_open'), true)
$$;
revoke all on function private.can_create_profile() from public, anon;
grant execute on function private.can_create_profile() to authenticated;
drop policy if exists "profiles: own insert" on public.profiles;
create policy "profiles: own insert" on public.profiles for insert to authenticated
  with check (id = (select auth.uid()) and private.can_create_profile());

-- Администратор может удалить любой план (например, нарушающий правила).
-- Удалить план может автор или администратор (одно правило — быстрее двух).
drop policy if exists "plans: admin delete" on public.plans;
drop policy if exists "plans: own delete" on public.plans;
create policy "plans: own delete" on public.plans for delete to authenticated using (author = (select auth.uid()) or private.is_admin());

-- Сводка для первой вкладки админки.
create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = public, auth, storage as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return json_build_object(
    'users', (select count(*) from profiles),
    'users_24h', (select count(*) from profiles where created_at > now() - interval '24 hours'),
    'users_7d', (select count(*) from profiles where created_at > now() - interval '7 days'),
    'verified', (select count(*) from profiles where verified),
    'plans_active', (select count(*) from plans where expires_at > now()),
    'plans_7d', (select count(*) from plans where created_at > now() - interval '7 days'),
    'messages_24h', (select count(*) from messages where created_at > now() - interval '24 hours'),
    'chats', (select count(*) from capsules),
    'posts', (select count(*) from shorts),
    'likes', (select count(*) from plan_likes) + (select count(*) from short_likes),
    'follows', (select count(*) from follows),
    'reports_open', (select count(*) from reports where status = 'open'),
    'bans', (select count(*) from bans),
    'verifications_pending', (select count(*) from verification_requests where status = 'pending'),
    'push_devices', (select count(*) from push_subscriptions),
    -- ежедневная сводка: ошибки, кто вернулся, заполненность бесплатного тарифа
    'bugs_new', (select count(*) from bug_reports where status = 'new'),
    'active_7d', (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
    'db_bytes', pg_database_size(current_database()),
    'storage_bytes', (select coalesce(sum((metadata->>'size')::bigint), 0) from storage.objects),
    -- рост: вернулись ли новички через неделю, откликаются ли на планы, кто приводит людей
    'ret_cohort', (select count(*) from profiles where created_at between now() - interval '35 days' and now() - interval '8 days'),
    'ret_back', (select count(*) from profiles p join auth.users u on u.id = p.id left join presence pr on pr.user_id = p.id
      where p.created_at between now() - interval '35 days' and now() - interval '8 days'
        and greatest(coalesce(pr.seen_at, 'epoch'), coalesce(u.last_sign_in_at, 'epoch')) >= p.created_at + interval '7 days'),
    'plan_responders_30d', (select count(distinct responder) from capsules where plan_id is not null and created_at > now() - interval '30 days'),
    'agreed_total', (select count(*) from capsules where status in ('agreed', 'contacts', 'met')),
    'met_total', (select count(*) from capsules where status = 'met'),
    'online_now', (select count(*) from presence where online_until > now()),
    'top_inviters', (select coalesce(json_agg(t order by t.n desc), '[]'::json) from (
      select pr.name, count(*) as n from referrals r join profiles pr on pr.id = r.inviter group by pr.name order by count(*) desc limit 5) t),
    'daily', (select coalesce(json_agg(json_build_object('day', d::date, 'users', (select count(*) from profiles where created_at::date = d::date), 'plans', (select count(*) from plans where created_at::date = d::date), 'messages', (select count(*) from messages where created_at::date = d::date)) order by d), '[]'::json)
              from generate_series(current_date - 13, current_date, interval '1 day') d)
  );
end $$;
revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

-- Список пользователей для админки (с почтой и датой последнего входа — их видит только администратор).
create or replace function public.admin_users(q text default '') returns table (
  id uuid, name text, age int, district text, photo_path text, verified boolean, created_at timestamptz,
  email text, last_sign_in_at timestamptz, is_admin boolean, banned boolean, ban_reason text,
  plans bigint, posts bigint, followers bigint, reports bigint
)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select p.id, p.name, p.age, p.district, p.photo_path, p.verified, p.created_at,
    u.email::text, u.last_sign_in_at,
    exists (select 1 from admins a where a.user_id = p.id),
    private.is_banned(p.id),
    (select b.reason from bans b where b.user_id = p.id),
    (select count(*) from plans x where x.author = p.id),
    (select count(*) from shorts x where x.author = p.id),
    (select count(*) from follows x where x.followee = p.id),
    (select count(*) from reports x where x.target = p.id)
  from profiles p join auth.users u on u.id = p.id
  where coalesce(q, '') = '' or p.name ilike '%' || q || '%' or u.email ilike '%' || q || '%' or p.district ilike '%' || q || '%'
  order by p.created_at desc
  limit 300;
end $$;
revoke all on function public.admin_users(text) from public, anon;
grant execute on function public.admin_users(text) to authenticated;

-- Галочка «проверен» вручную.
create or replace function public.admin_set_verified(u uuid, v boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update profiles set verified = v where id = u;
end $$;
revoke all on function public.admin_set_verified(uuid, boolean) from public, anon;
grant execute on function public.admin_set_verified(uuid, boolean) to authenticated;

-- Назначить или снять администратора (последнего снять нельзя).
create or replace function public.admin_set_admin(u uuid, v boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if v then insert into admins (user_id) values (u) on conflict do nothing;
  else
    if (select count(*) from admins) <= 1 then raise exception 'last admin' using errcode = 'P0001'; end if;
    delete from admins where user_id = u;
  end if;
end $$;
revoke all on function public.admin_set_admin(uuid, boolean) from public, anon;
grant execute on function public.admin_set_admin(uuid, boolean) to authenticated;

-- Возраст необязателен: человек может не указывать дату рождения.
alter table public.profiles alter column age drop not null;
alter table public.profiles drop constraint if exists profiles_age_check;
alter table public.profiles add constraint profiles_age_check check (age is null or age between 18 and 99);

-- Дата рождения — только для самого человека (другие видят лишь возраст).
create table if not exists public.profile_private (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  birth_date date check (birth_date is null or (birth_date > date '1900-01-01' and birth_date <= current_date - interval '18 years'))
);
alter table public.profile_private enable row level security;
revoke all on public.profile_private from anon, authenticated;
grant select, insert, update, delete on public.profile_private to authenticated;
drop policy if exists "private: own" on public.profile_private;
create policy "private: own" on public.profile_private for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Комментарии к публикациям (шортсы и посты с фото), как к планам.
create table if not exists public.short_comments (
  id bigint generated always as identity primary key,
  short_id uuid not null references public.shorts (id) on delete cascade,
  author uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists short_comments_short_idx on public.short_comments (short_id, created_at);
create index if not exists short_comments_author_idx on public.short_comments (author);
alter table public.short_comments add column if not exists reply_to bigint references public.short_comments (id) on delete cascade;
create index if not exists short_comments_reply_idx on public.short_comments (reply_to);
alter table public.short_comments enable row level security;
revoke all on public.short_comments from anon, authenticated;
grant select, delete on public.short_comments to authenticated;
grant insert (short_id, body, reply_to) on public.short_comments to authenticated;
drop policy if exists "short comments: read" on public.short_comments;
create policy "short comments: read" on public.short_comments for select to authenticated
  using (author = (select auth.uid()) or private.is_admin() or (not private.is_banned(author) and not private.blocked_between(author, (select auth.uid()))));
-- Ответ можно оставить только на комментарий того же плана или публикации. Функция нужна,
-- потому что политика не может сама читать свою таблицу (бесконечная рекурсия).
create or replace function private.can_reply_plan(reply bigint, plan uuid, me uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.plan_comments r where r.id = reply and r.plan_id = plan and not private.blocked_between(r.author, me))
$$;
create or replace function private.can_reply_short(reply bigint, short uuid, me uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.short_comments r where r.id = reply and r.short_id = short and not private.blocked_between(r.author, me))
$$;
revoke all on function private.can_reply_plan(bigint, uuid, uuid), private.can_reply_short(bigint, uuid, uuid) from public;
grant execute on function private.can_reply_plan(bigint, uuid, uuid), private.can_reply_short(bigint, uuid, uuid) to authenticated;

drop policy if exists "comments: write" on public.plan_comments;
create policy "comments: write" on public.plan_comments for insert to authenticated with check (
  author = (select auth.uid()) and not private.is_banned((select auth.uid()))
  and exists (select 1 from plans p where p.id = plan_id and not private.blocked_between(p.author, (select auth.uid())))
  and (reply_to is null or private.can_reply_plan(reply_to, plan_id, (select auth.uid())))
);
drop policy if exists "short comments: write" on public.short_comments;
create policy "short comments: write" on public.short_comments for insert to authenticated with check (
  author = (select auth.uid()) and not private.is_banned((select auth.uid()))
  and exists (select 1 from public.shorts s where s.id = short_id and not private.blocked_between(s.author, (select auth.uid())))
  and (reply_to is null or private.can_reply_short(reply_to, short_id, (select auth.uid())))
);
drop policy if exists "short comments: delete" on public.short_comments;
create policy "short comments: delete" on public.short_comments for delete to authenticated using (
  author = (select auth.uid()) or private.is_admin()
  or exists (select 1 from public.shorts s where s.id = short_id and s.author = (select auth.uid()))
);

-- Аватарки — в открытом хранилище avatars/<владелец>/<файл>: постоянная ссылка, видна и на экране входа.
-- В profiles.photo_path такие фото записаны как «avatars/<владелец>/<файл>». Фото планов остаются закрытыми (media).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "avatar files: own list" on storage.objects;
create policy "avatar files: own list" on storage.objects for select to authenticated using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists "avatar files: upload own" on storage.objects;
create policy "avatar files: upload own" on storage.objects for insert to authenticated with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and not private.is_banned((select auth.uid()))
);
drop policy if exists "avatar files: delete own" on storage.objects;
create policy "avatar files: delete own" on storage.objects for delete to authenticated using (
  bucket_id = 'avatars' and ((storage.foldername(name))[1] = (select auth.uid())::text or private.is_admin())
);

-- Групповые чаты: группа, участники и сообщения. Создатель (owner) добавляет и удаляет людей,
-- переименовывает и удаляет группу; любой участник может писать и выйти.
create table if not exists public.group_chats (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 60),
  owner uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists group_chats_owner_idx on public.group_chats (owner);
create table if not exists public.group_members (
  group_id uuid not null references public.group_chats (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  read_at timestamptz,
  primary key (group_id, user_id)
);
create index if not exists group_members_user_idx on public.group_members (user_id);
create table if not exists public.group_messages (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.group_chats (id) on delete cascade,
  sender uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null default '',
  photo_path text check (photo_path is null or char_length(photo_path) <= 200),
  created_at timestamptz not null default now(),
  constraint group_messages_content_check check (char_length(body) <= 2000 and (char_length(body) >= 1 or photo_path is not null))
);
create index if not exists group_messages_group_idx on public.group_messages (group_id, created_at);
create index if not exists group_messages_sender_idx on public.group_messages (sender);

create or replace function private.in_group(g uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.group_members m where m.group_id = g and m.user_id = (select auth.uid()))
$$;
create or replace function private.is_group_owner(g uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.group_chats c where c.id = g and c.owner = (select auth.uid()))
$$;
create or replace function private.group_size(g uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.group_members m where m.group_id = g
$$;
revoke all on function private.in_group(uuid), private.is_group_owner(uuid), private.group_size(uuid) from public, anon;
grant execute on function private.in_group(uuid), private.is_group_owner(uuid), private.group_size(uuid) to authenticated;

alter table public.group_chats enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;
revoke all on public.group_chats, public.group_members, public.group_messages from anon, authenticated;
grant select, delete on public.group_chats to authenticated;
grant insert (id, title) on public.group_chats to authenticated;
grant update (title) on public.group_chats to authenticated;
grant select, delete on public.group_members to authenticated;
grant insert (group_id, user_id) on public.group_members to authenticated;
grant update (read_at) on public.group_members to authenticated;
grant select, delete on public.group_messages to authenticated;
grant insert (group_id, body, photo_path) on public.group_messages to authenticated;

drop policy if exists "groups: read" on public.group_chats;
create policy "groups: read" on public.group_chats for select to authenticated using (owner = (select auth.uid()) or private.in_group(id));
drop policy if exists "groups: create" on public.group_chats;
create policy "groups: create" on public.group_chats for insert to authenticated
  with check (owner = (select auth.uid()) and not private.is_banned((select auth.uid())));
drop policy if exists "groups: rename" on public.group_chats;
create policy "groups: rename" on public.group_chats for update to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
drop policy if exists "groups: delete" on public.group_chats;
create policy "groups: delete" on public.group_chats for delete to authenticated using (owner = (select auth.uid()));

drop policy if exists "group members: read" on public.group_members;
create policy "group members: read" on public.group_members for select to authenticated using (private.in_group(group_id));
-- Добавляет только создатель; не больше 50 человек; нельзя добавить того, с кем есть блокировка.
drop policy if exists "group members: add" on public.group_members;
create policy "group members: add" on public.group_members for insert to authenticated with check (
  private.is_group_owner(group_id) and not private.is_banned((select auth.uid()))
  and not private.blocked_between(user_id, (select auth.uid()))
  and private.group_size(group_id) < 50
);
-- Выйти может любой, кроме создателя (он удаляет группу); создатель может убрать любого другого.
drop policy if exists "group members: leave or remove" on public.group_members;
create policy "group members: leave or remove" on public.group_members for delete to authenticated using (
  (user_id = (select auth.uid()) and not private.is_group_owner(group_id))
  or (private.is_group_owner(group_id) and user_id <> (select auth.uid()))
);
drop policy if exists "group members: mark read" on public.group_members;
create policy "group members: mark read" on public.group_members for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "group messages: read" on public.group_messages;
create policy "group messages: read" on public.group_messages for select to authenticated using (private.in_group(group_id));
drop policy if exists "group messages: send" on public.group_messages;
create policy "group messages: send" on public.group_messages for insert to authenticated with check (
  sender = (select auth.uid()) and private.in_group(group_id) and not private.is_banned((select auth.uid()))
);
drop policy if exists "group messages: delete own" on public.group_messages;
create policy "group messages: delete own" on public.group_messages for delete to authenticated
  using (sender = (select auth.uid()) or private.is_group_owner(group_id));

-- Фото в групповых чатах лежат в том же хранилище chat/<id группы>/.
drop policy if exists "chat files: participants read" on storage.objects;
create policy "chat files: participants read" on storage.objects for select to authenticated using (
  bucket_id = 'chat' and (private.in_capsule(((storage.foldername(name))[1])::uuid) or private.in_group(((storage.foldername(name))[1])::uuid))
);
drop policy if exists "chat files: participants upload" on storage.objects;
create policy "chat files: participants upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'chat' and (private.can_write(((storage.foldername(name))[1])::uuid)
    or (private.in_group(((storage.foldername(name))[1])::uuid) and not private.is_banned((select auth.uid()))))
);

-- Push всем участникам группы, кроме отправителя.
create or replace function private.on_group_message_push() returns trigger
language plpgsql security definer set search_path = public, vault, extensions as $$
begin
  perform net.http_post(
    url := 'https://mrivbqkqdaxtvwcsljzu.supabase.co/functions/v1/push',
    body := json_build_object('group_message_id', new.id)::jsonb,
    headers := json_build_object('Content-Type', 'application/json',
      'x-push-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'iskra_push_hook'))::jsonb,
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  return new;
end $$;
revoke all on function private.on_group_message_push() from public, anon, authenticated;
drop trigger if exists group_messages_push on public.group_messages;
create trigger group_messages_push after insert on public.group_messages for each row execute function private.on_group_message_push();

do $$ begin
  begin alter publication supabase_realtime add table public.group_chats; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.group_members; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.group_messages; exception when duplicate_object then null; end;
end $$;

-- Чат компании: у группового плана один общий групповой чат. Создатель чата — автор плана.
alter table public.group_chats add column if not exists plan_id uuid references public.plans (id) on delete set null;
create unique index if not exists group_chats_plan_uniq on public.group_chats (plan_id) where plan_id is not null;

-- Присоединиться к компании плана: создаёт чат, если его ещё нет, добавляет автора и меня.
-- Проверяет места, срок плана, баны и блокировки. Возвращает id чата.
create or replace function public.join_plan_group(p uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  pl record;
  g uuid;
begin
  if me is null or private.is_banned(me) then raise exception 'not allowed'; end if;
  select id, author, title, group_size, expires_at into pl from public.plans where id = p;
  if pl.id is null or pl.group_size is null then raise exception 'not a group plan'; end if;
  if private.blocked_between(pl.author, me) then raise exception 'not allowed'; end if;
  select id into g from public.group_chats where plan_id = p;
  if g is null then
    if pl.expires_at < now() then raise exception 'plan expired'; end if;
    insert into public.group_chats (title, owner, plan_id) values (left(pl.title, 60), pl.author, p) returning id into g;
    insert into public.group_members (group_id, user_id) values (g, pl.author) on conflict do nothing;
  end if;
  if not exists (select 1 from public.group_members where group_id = g and user_id = me) then
    if pl.expires_at < now() then raise exception 'plan expired'; end if;
    if (select count(*) from public.group_members where group_id = g) >= pl.group_size then raise exception 'group full'; end if;
    insert into public.group_members (group_id, user_id) values (g, me);
  end if;
  return g;
end $$;
revoke all on function public.join_plan_group(uuid) from public, anon;
grant execute on function public.join_plan_group(uuid) to authenticated;

-- Кто уже в компании у действующих групповых планов (видно всем: аватарки «Компания 2 из 4»).
create or replace function public.plan_companies() returns table (plan_id uuid, user_id uuid)
language sql stable security definer set search_path = '' as $$
  select c.plan_id, m.user_id from public.group_chats c
  join public.plans pl on pl.id = c.plan_id and pl.expires_at > now() - interval '7 days'
  join public.group_members m on m.group_id = c.id
  where (select auth.uid()) is not null
$$;
revoke all on function public.plan_companies() from public, anon;
grant execute on function public.plan_companies() to authenticated;

-- «Свободен сейчас»: до какого времени человек готов встретиться. Ставится только через set_free —
-- время берём серверное и ограничиваем 4 часами.
alter table public.profiles add column if not exists free_until timestamptz;
create or replace function public.set_free(minutes integer) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare t timestamptz;
begin
  if (select auth.uid()) is null or private.is_banned((select auth.uid())) then raise exception 'not allowed'; end if;
  t := case when minutes is null or minutes <= 0 then null else now() + make_interval(mins => least(minutes, 240)) end;
  update public.profiles set free_until = t where id = (select auth.uid());
  return t;
end $$;
revoke all on function public.set_free(integer) from public, anon;
grant execute on function public.set_free(integer) to authenticated;

-- Надёжность: «не пришёл(ла)» можно отметить только в своей переписке, где вы договорились о встрече.
-- Кто отметил — видит только сам отметивший; остальным доступно лишь число пропусков.
-- Если потом встречу подтвердили кодами, отметка не считается.
create table if not exists public.no_shows (
  capsule_id uuid not null references public.capsules (id) on delete cascade,
  reporter uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (capsule_id, reporter)
);
create index if not exists no_shows_target_idx on public.no_shows (target);
alter table public.no_shows enable row level security;
revoke all on public.no_shows from anon, authenticated;
grant select, delete on public.no_shows to authenticated;
grant insert (capsule_id, target) on public.no_shows to authenticated;
drop policy if exists "no shows: own" on public.no_shows;
create policy "no shows: own" on public.no_shows for select to authenticated using (reporter = (select auth.uid()));
drop policy if exists "no shows: undo" on public.no_shows;
create policy "no shows: undo" on public.no_shows for delete to authenticated using (reporter = (select auth.uid()));
drop policy if exists "no shows: report" on public.no_shows;
create policy "no shows: report" on public.no_shows for insert to authenticated with check (
  reporter = (select auth.uid()) and not private.is_banned((select auth.uid()))
  and exists (
    select 1 from public.capsules c
    where c.id = capsule_id and c.status in ('agreed', 'contacts')
      and ((c.author = (select auth.uid()) and c.responder = target) or (c.responder = (select auth.uid()) and c.author = target))
  )
);
create or replace function public.no_show_counts() returns table (user_id uuid, missed integer)
language sql stable security definer set search_path = '' as $$
  select n.target, count(*)::int from public.no_shows n
  join public.capsules c on c.id = n.capsule_id and c.status <> 'met'
  where (select auth.uid()) is not null
  group by n.target
$$;
revoke all on function public.no_show_counts() from public, anon;
grant execute on function public.no_show_counts() to authenticated;

-- Общий плейлист переписки (личной или групповой): «саундтрек встречи». До 50 песен на чат.
create table if not exists public.chat_tracks (
  id bigint generated always as identity primary key,
  chat_id uuid not null,
  added_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  track jsonb not null check (pg_column_size(track) < 4000),
  created_at timestamptz not null default now()
);
create index if not exists chat_tracks_chat_idx on public.chat_tracks (chat_id, created_at);
create or replace function private.in_chat(c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.in_capsule(c) or private.in_group(c)
$$;
revoke all on function private.in_chat(uuid) from public, anon;
grant execute on function private.in_chat(uuid) to authenticated;
create or replace function private.chat_track_count(c uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.chat_tracks where chat_id = c
$$;
revoke all on function private.chat_track_count(uuid) from public, anon;
grant execute on function private.chat_track_count(uuid) to authenticated;
alter table public.chat_tracks enable row level security;
revoke all on public.chat_tracks from anon, authenticated;
grant select, delete on public.chat_tracks to authenticated;
grant insert (chat_id, track) on public.chat_tracks to authenticated;
drop policy if exists "chat tracks: read" on public.chat_tracks;
create policy "chat tracks: read" on public.chat_tracks for select to authenticated using (private.in_chat(chat_id));
drop policy if exists "chat tracks: add" on public.chat_tracks;
create policy "chat tracks: add" on public.chat_tracks for insert to authenticated with check (
  added_by = (select auth.uid()) and not private.is_banned((select auth.uid()))
  and private.in_chat(chat_id) and private.chat_track_count(chat_id) < 50
);
drop policy if exists "chat tracks: remove own" on public.chat_tracks;
create policy "chat tracks: remove own" on public.chat_tracks for delete to authenticated using (added_by = (select auth.uid()));
do $$ begin
  begin alter publication supabase_realtime add table public.chat_tracks; exception when duplicate_object then null; end;
end $$;

-- Реакции на сообщения в чатах (личных и групповых): одна реакция от человека на сообщение.
create table if not exists public.message_reactions (
  chat_id uuid not null,
  message_id bigint not null,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  emoji text not null check (emoji in ('🔥', '☕', '🎶', '🤝', '😂', '❤️')),
  created_at timestamptz not null default now(),
  primary key (chat_id, message_id, user_id)
);
alter table public.message_reactions enable row level security;
revoke all on public.message_reactions from anon, authenticated;
grant select, delete on public.message_reactions to authenticated;
grant insert (chat_id, message_id, emoji) on public.message_reactions to authenticated;
grant update (emoji) on public.message_reactions to authenticated;
drop policy if exists "reactions: read" on public.message_reactions;
create policy "reactions: read" on public.message_reactions for select to authenticated using (private.in_chat(chat_id));
drop policy if exists "reactions: add" on public.message_reactions;
create policy "reactions: add" on public.message_reactions for insert to authenticated with check (
  user_id = (select auth.uid()) and not private.is_banned((select auth.uid())) and private.in_chat(chat_id)
);
drop policy if exists "reactions: change own" on public.message_reactions;
create policy "reactions: change own" on public.message_reactions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "reactions: remove own" on public.message_reactions;
create policy "reactions: remove own" on public.message_reactions for delete to authenticated using (user_id = (select auth.uid()));
do $$ begin
  begin alter publication supabase_realtime add table public.message_reactions; exception when duplicate_object then null; end;
end $$;

-- Напоминание за час до встречи: push автору плана, откликнувшимся и участникам компании. Каждому — один раз.
create extension if not exists pg_cron;
create table if not exists private.plan_reminders_sent (
  plan_id uuid not null references public.plans (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);
create or replace function private.send_plan_reminders() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  pl record;
  users uuid[];
  total integer := 0;
begin
  for pl in
    select p.id from public.plans p
    where p.starts_at between now() + interval '40 minutes' and now() + interval '65 minutes'
  loop
    with who as (
      select p.author as u from public.plans p where p.id = pl.id
        and exists (select 1 from public.capsules c where c.plan_id = p.id)
      union select c.responder from public.capsules c where c.plan_id = pl.id
      union select m.user_id from public.group_chats g join public.group_members m on m.group_id = g.id where g.plan_id = pl.id
    ), fresh as (
      insert into private.plan_reminders_sent (plan_id, user_id)
      select pl.id, who.u from who
      where not exists (select 1 from private.plan_reminders_sent s where s.plan_id = pl.id and s.user_id = who.u)
      on conflict do nothing
      returning user_id
    )
    select array_agg(user_id) into users from fresh;
    if users is not null then
      total := total + coalesce(array_length(users, 1), 0);
      perform net.http_post(
        url := 'https://mrivbqkqdaxtvwcsljzu.supabase.co/functions/v1/push',
        body := json_build_object('reminder_plan_id', pl.id, 'users', users)::jsonb,
        headers := json_build_object('Content-Type', 'application/json',
          'x-push-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'iskra_push_hook'))::jsonb,
        timeout_milliseconds := 5000
      );
    end if;
  end loop;
  return total;
end $$;
revoke all on function private.send_plan_reminders() from public, anon, authenticated;
select cron.unschedule(jobid) from cron.job where jobname = 'match-plan-reminders';
select cron.schedule('match-plan-reminders', '*/5 * * * *', 'select private.send_plan_reminders()');

-- Истории как в Instagram: фото, видео или текст на цветном фоне; видны 24 часа.
-- Файлы лежат в хранилище shorts/<автор>/story-*.
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('photo', 'video', 'text')),
  path text check (path is null or char_length(path) <= 200),
  caption text not null default '' check (char_length(caption) <= 300),
  hue integer not null default 330 check (hue between 0 and 360),
  duration real check (duration is null or duration between 0 and 61),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  check (kind = 'text' or path is not null),
  check (kind <> 'text' or char_length(caption) >= 1)
);
create index if not exists stories_author_idx on public.stories (author, created_at);
create index if not exists stories_expires_idx on public.stories (expires_at);
alter table public.stories enable row level security;
revoke all on public.stories from anon, authenticated;
grant select, delete on public.stories to authenticated;
grant insert (id, kind, path, caption, hue, duration) on public.stories to authenticated;
drop policy if exists "stories: read" on public.stories;
create policy "stories: read" on public.stories for select to authenticated using (
  author = (select auth.uid())
  or (expires_at > now() and not private.is_banned(author) and not private.blocked_between(author, (select auth.uid())))
);
drop policy if exists "stories: add own" on public.stories;
create policy "stories: add own" on public.stories for insert to authenticated with check (
  author = (select auth.uid()) and not private.is_banned((select auth.uid()))
  and (path is null or path like (select auth.uid())::text || '/%')
);
drop policy if exists "stories: delete" on public.stories;
create policy "stories: delete" on public.stories for delete to authenticated using (author = (select auth.uid()) or private.is_admin());

-- Кто посмотрел: автор видит список, зритель — только свою отметку.
create table if not exists public.story_views (
  story_id uuid not null references public.stories (id) on delete cascade,
  viewer uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer)
);
alter table public.story_views enable row level security;
revoke all on public.story_views from anon, authenticated;
grant select on public.story_views to authenticated;
grant insert (story_id) on public.story_views to authenticated;
create or replace function private.story_author(s uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select author from public.stories where id = s
$$;
revoke all on function private.story_author(uuid) from public, anon;
grant execute on function private.story_author(uuid) to authenticated;
drop policy if exists "story views: read" on public.story_views;
create policy "story views: read" on public.story_views for select to authenticated
  using (viewer = (select auth.uid()) or private.story_author(story_id) = (select auth.uid()));
drop policy if exists "story views: add" on public.story_views;
create policy "story views: add" on public.story_views for insert to authenticated with check (
  viewer = (select auth.uid())
  and exists (select 1 from public.stories s where s.id = story_id and s.author <> (select auth.uid()) and s.expires_at > now())
);
do $$ begin
  begin alter publication supabase_realtime add table public.stories; exception when duplicate_object then null; end;
end $$;

-- Камера историй: фильтр Match и стикеры («Позвать», трек).
alter table public.stories add column if not exists filter text not null default 'none'
  check (filter in ('none', 'spark', 'sunset', 'minsk', 'cold', 'vivid'));
alter table public.stories add column if not exists sticker jsonb check (sticker is null or pg_column_size(sticker) < 3000);
grant insert (filter, sticker) on public.stories to authenticated;

-- Редактор публикаций: фильтр Match, песня и место.
alter table public.shorts add column if not exists filter text not null default 'none'
  check (filter in ('none', 'spark', 'sunset', 'minsk', 'cold', 'vivid'));
alter table public.shorts add column if not exists music jsonb check (music is null or pg_column_size(music) < 3000);
alter table public.shorts add column if not exists place text check (place is null or char_length(place) <= 60);
grant insert (filter, music, place) on public.shorts to authenticated;

-- Сообщения об ошибках от тестировщиков: текст, где случилось, устройство и скриншот.
-- Видят только автор и модераторы; скриншоты — в закрытом хранилище reports.
create table if not exists public.bug_reports (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  page text check (char_length(page) <= 200),
  device text check (char_length(device) <= 400),
  version text check (char_length(version) <= 40),
  shot_path text check (char_length(shot_path) <= 200),
  status text not null default 'new' check (status in ('new', 'done')),
  created_at timestamptz not null default now()
);
create index if not exists bug_reports_created_idx on public.bug_reports (created_at desc);
alter table public.bug_reports enable row level security;
revoke all on public.bug_reports from anon, authenticated;
grant select on public.bug_reports to authenticated;
grant insert (body, page, device, version, shot_path) on public.bug_reports to authenticated;
grant update (status) on public.bug_reports to authenticated;
grant delete on public.bug_reports to authenticated;
-- Не больше 20 сообщений в час. Счёт — в отдельной функции: обращение к самой таблице внутри её правила зациклилось бы.
create or replace function private.bug_reports_last_hour(u uuid) returns integer language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.bug_reports where user_id = u and created_at > now() - interval '1 hour'
$$;
revoke all on function private.bug_reports_last_hour(uuid) from public, anon;
grant execute on function private.bug_reports_last_hour(uuid) to authenticated;
drop policy if exists "bugs: send" on public.bug_reports;
create policy "bugs: send" on public.bug_reports for insert to authenticated with check (
  user_id = (select auth.uid()) and not private.is_banned((select auth.uid()))
  and (shot_path is null or shot_path like (select auth.uid())::text || '/%')
  and private.bug_reports_last_hour((select auth.uid())) < 20
);
drop policy if exists "bugs: read own or admin" on public.bug_reports;
create policy "bugs: read own or admin" on public.bug_reports for select to authenticated using (user_id = (select auth.uid()) or private.is_admin());
drop policy if exists "bugs: admin marks" on public.bug_reports;
create policy "bugs: admin marks" on public.bug_reports for update to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists "bugs: admin deletes" on public.bug_reports;
create policy "bugs: admin deletes" on public.bug_reports for delete to authenticated using (private.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reports', 'reports', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "report shots: upload own" on storage.objects;
create policy "report shots: upload own" on storage.objects for insert to authenticated with check (
  bucket_id = 'reports' and (storage.foldername(name))[1] = (select auth.uid())::text and not private.is_banned((select auth.uid()))
);
drop policy if exists "report shots: read own or admin" on storage.objects;
create policy "report shots: read own or admin" on storage.objects for select to authenticated using (
  bucket_id = 'reports' and ((storage.foldername(name))[1] = (select auth.uid())::text or private.is_admin())
);
drop policy if exists "report shots: admin deletes" on storage.objects;
create policy "report shots: admin deletes" on storage.objects for delete to authenticated using (bucket_id = 'reports' and private.is_admin());

-- Индексы по внешним ключам на пользователя: удаление аккаунта не перебирает таблицы целиком.
create index if not exists plan_reminders_sent_user_idx on private.plan_reminders_sent (user_id);
create index if not exists bug_reports_user_idx on public.bug_reports (user_id);
create index if not exists chat_tracks_added_by_idx on public.chat_tracks (added_by);
create index if not exists message_reactions_user_idx on public.message_reactions (user_id);
create index if not exists no_shows_reporter_idx on public.no_shows (reporter);
create index if not exists story_views_viewer_idx on public.story_views (viewer);

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
  begin alter publication supabase_realtime add table public.plan_comments; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.shorts; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.plan_likes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.short_likes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.follows; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.plan_shares; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.app_settings; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.short_comments; exception when duplicate_object then null; end;
end $$;


-- ===== Защита в чатах (октябрь 2026) =====
-- «Писать мне могут только проверенные»
alter table public.profiles add column if not exists only_verified boolean not null default false;
grant insert (only_verified), update (only_verified) on public.profiles to authenticated;

-- Перед каждым сообщением: не больше 3 подряд без ответа; «только проверенные»; просьбы о деньгах — модератору.
create or replace function private.message_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare other uuid; mine int; total int;
begin
  select case when c.author = new.sender then c.responder else c.author end into other from capsules c where c.id = new.capsule_id;
  select count(*), count(*) filter (where t.sender = new.sender) into total, mine
    from (select sender from messages where capsule_id = new.capsule_id order by created_at desc, id desc limit 3) t;
  if total = 3 and mine = 3 then raise exception 'wait-reply' using errcode = 'P0001'; end if;
  if other is not null and exists (select 1 from profiles where id = other and only_verified)
     and not exists (select 1 from profiles where id = new.sender and verified)
     and not exists (select 1 from messages where capsule_id = new.capsule_id and sender = other) then
    raise exception 'only-verified' using errcode = 'P0001';
  end if;
  if other is not null and new.body ~* '(\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}|переве(ди|сти|дите)|скин(ь|уть|ьте) (деньг|на карт|денег)|номер карты|реквизит|займ(и|ёшь|ешь)|одолж|в долг|usdt|bitcoin|биткоин|крипт)'
     and not exists (select 1 from reports where target = new.sender and reason = 'auto:money' and created_at > now() - interval '1 day') then
    insert into reports (reporter, target, reason, body) values (other, new.sender, 'auto:money', left(new.body, 500));
  end if;
  return new;
end $$;
drop trigger if exists messages_guard on public.messages;
create trigger messages_guard before insert on public.messages for each row execute function private.message_guard();

-- 3 жалобы от разных людей — профиль скрывается (бан с пометкой) до проверки модератором.
create or replace function private.auto_hide() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.reason not like 'auto:%'
     and (select count(distinct reporter) from reports where target = new.target and status = 'open' and reason not like 'auto:%') >= 3 then
    insert into bans (user_id, reason) values (new.target, 'Скрыт автоматически: 3 жалобы от разных людей — проверьте и снимите или подтвердите бан')
    on conflict (user_id) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists reports_auto_hide on public.reports;
create trigger reports_auto_hide after insert on public.reports for each row execute function private.auto_hide();

-- Лимит новых чатов в сутки (защита от спама): аккаунт младше 7 дней — 10, остальные — 30.
create or replace function private.chat_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare fresh boolean; n int; lim int;
begin
  select created_at > now() - interval '7 days' into fresh from profiles where id = new.responder;
  select count(*) into n from capsules where responder = new.responder and created_at > now() - interval '24 hours';
  lim := 30;
  if coalesce(fresh, true) then lim := 10; end if;
  if n >= lim then raise exception 'chat-limit' using errcode = 'P0001'; end if;
  return new;
end $$;
drop trigger if exists capsules_chat_limit on public.capsules;
create trigger capsules_chat_limit before insert on public.capsules for each row execute function private.chat_limit();

-- Вход по нику (функция nick-auth): счётчик попыток для лимитов и поиск почты по нику только для сервера.
create table if not exists public.auth_attempts (id bigint generated always as identity primary key, kind text not null, key text not null, created_at timestamptz not null default now());
create index if not exists auth_attempts_idx on public.auth_attempts (kind, key, created_at desc);
alter table public.auth_attempts enable row level security;
revoke all on public.auth_attempts from anon, authenticated;
create or replace function public.nick_email(n text) returns text
language sql stable security definer set search_path = auth, public as $$
  select email::text from auth.users where lower(raw_user_meta_data->>'nick') = lower(n) or email = lower(n) || '@users.komeeta.com' order by (email like '%@users.komeeta.com') limit 1
$$;
revoke all on function public.nick_email(text) from public, anon, authenticated;
grant execute on function public.nick_email(text) to service_role;

-- ── Рефералы и «Основатели Komeeta» ─────────────────────────────────────
create table if not exists public.referrals (
  invitee uuid primary key references public.profiles(id) on delete cascade,
  inviter uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (invitee <> inviter)
);
alter table public.referrals enable row level security;

create table if not exists public.founders (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  number int not null unique,
  granted_at timestamptz not null default now()
);
alter table public.founders enable row level security;
grant select on public.founders to authenticated;
create policy "founders: read" on public.founders for select to authenticated using (true);

create or replace function public.claim_referral(inviter uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or inviter is null or inviter = me then return false; end if;
  if not exists (select 1 from profiles where id = me and created_at > now() - interval '3 days') then return false; end if;
  if not exists (select 1 from profiles where id = inviter) then return false; end if;
  insert into referrals (invitee, inviter) values (me, inviter) on conflict (invitee) do nothing;
  return found;
end $$;

create or replace function public.my_invites() returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); invited int; active int; num int; total int;
begin
  if me is null then raise exception 'forbidden' using errcode = '42501'; end if;
  select count(*) into invited from referrals where inviter = me;
  select count(*) into active from referrals r where r.inviter = me
    and (exists (select 1 from plans p where p.author = r.invitee) or exists (select 1 from messages m where m.sender = r.invitee));
  select number into num from founders where user_id = me;
  select count(*) into total from founders;
  if num is null and active >= 3 and total < 100 then
    perform pg_advisory_xact_lock(4242);
    select count(*) into total from founders;
    if total < 100 then
      insert into founders (user_id, number) values (me, total + 1) on conflict (user_id) do nothing;
      num := total + 1; total := total + 1;
    end if;
  end if;
  return json_build_object('invited', invited, 'active', active, 'founder', num, 'founders', total, 'goal', 3, 'limit', 100);
end $$;
revoke all on function public.claim_referral(uuid), public.my_invites() from public, anon;
grant execute on function public.claim_referral(uuid), public.my_invites() to authenticated;

-- Плюсы основателей: стена основателей и подъём плана раз в 30 дней
alter table public.founders add column if not exists on_wall boolean not null default true,
  add column if not exists boost_plan uuid, add column if not exists boost_at timestamptz;

create or replace function public.founder_boost(plan uuid) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); last timestamptz;
begin
  if me is null then raise exception 'forbidden' using errcode = '42501'; end if;
  select boost_at into last from founders where user_id = me;
  if not found then raise exception 'not-founder' using errcode = 'P0001'; end if;
  if last is not null and last > now() - interval '30 days' then raise exception 'boost-wait' using errcode = 'P0001'; end if;
  if not exists (select 1 from plans where id = plan and author = me and expires_at > now()) then raise exception 'not-found' using errcode = 'P0001'; end if;
  update founders set boost_plan = plan, boost_at = now() where user_id = me;
  return now();
end $$;

create or replace function public.founder_wall(show boolean) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'forbidden' using errcode = '42501'; end if;
  update founders set on_wall = show where user_id = auth.uid();
  return found;
end $$;
revoke all on function public.founder_boost(uuid), public.founder_wall(boolean) from public, anon;
grant execute on function public.founder_boost(uuid), public.founder_wall(boolean) to authenticated;

-- Забаненным администрацией не пишут: ни в старые переписки, ни в новые, ни в группы
create or replace function private.can_write(c uuid) returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.capsules x
    where x.id = c and (select auth.uid()) in (x.author, x.responder)
      and not exists (select 1 from public.blocks b where (b.blocker = x.author and b.blocked = x.responder) or (b.blocker = x.responder and b.blocked = x.author))
      and not exists (select 1 from public.bans where user_id in (x.author, x.responder))
  )
$$;
alter policy "capsules: open" on public.capsules with check ((responder = (select auth.uid())) and (author <> responder) and (not private.is_banned((select auth.uid()))) and (not private.is_banned(author)) and (not private.blocked_between(author, responder)) and (((plan_id is not null) and (author = (select p.author from plans p where ((p.id = capsules.plan_id) and (p.expires_at > now()))))) or ((plan_id is null) and (exists (select 1 from profiles pr where (pr.id = capsules.author))))));
alter policy "group members: add" on public.group_members with check (private.is_group_owner(group_id) and (not private.is_banned((select auth.uid()))) and (not private.is_banned(user_id)) and (not private.blocked_between(user_id, (select auth.uid()))) and (private.group_size(group_id) < 50));

-- Свои интересы: не больше 20, каждый до 24 символов
create or replace function private.tags_ok(t text[]) returns boolean language sql immutable as $$ select cardinality(t) <= 20 and coalesce((select bool_and(char_length(x) between 1 and 24) from unnest(t) x), true) $$;
alter table public.profiles drop constraint if exists profiles_tags_check;
alter table public.profiles add constraint profiles_tags_check check (private.tags_ok(tags));

-- Лимит «3 сообщения без ответа» действует, только пока собеседник ни разу не ответил
create or replace function private.message_guard() returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare other uuid; mine int; total int; replied boolean;
begin
  select case when c.author = new.sender then c.responder else c.author end into other from capsules c where c.id = new.capsule_id;
  replied := other is not null and exists (select 1 from messages where capsule_id = new.capsule_id and sender = other);
  if not replied then
    select count(*), count(*) filter (where t.sender = new.sender) into total, mine
      from (select sender from messages where capsule_id = new.capsule_id order by created_at desc, id desc limit 3) t;
    if total = 3 and mine = 3 then raise exception 'wait-reply' using errcode = 'P0001'; end if;
  end if;
  if other is not null and not replied and exists (select 1 from profiles where id = other and only_verified)
     and not exists (select 1 from profiles where id = new.sender and verified) then
    raise exception 'only-verified' using errcode = 'P0001';
  end if;
  if other is not null and new.body ~* '(\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}|переве(ди|сти|дите)|скин(ь|уть|ьте) (деньг|на карт|денег)|номер карты|реквизит|займ(и|ёшь|ешь)|одолж|в долг|usdt|bitcoin|биткоин|крипт)'
     and not exists (select 1 from reports where target = new.sender and reason = 'auto:money' and created_at > now() - interval '1 day') then
    insert into reports (reporter, target, reason, body) values (other, new.sender, 'auto:money', left(new.body, 500));
  end if;
  return new;
end $function$;

-- ── Звонки и видеозвонки (WebRTC): сигналы через таблицу, звук и видео идут напрямую ──
alter table public.profiles add column if not exists calls_off boolean not null default false;
grant select (calls_off), insert (calls_off), update (calls_off) on public.profiles to authenticated;

-- Звонить можно только тому, с кем уже переписывались в обе стороны; без блокировок, банов и запрета звонков.
create or replace function private.can_call(other uuid) returns boolean language sql stable security definer set search_path to 'public' as $$
  select (select auth.uid()) is not null and other <> (select auth.uid())
    and not exists (select 1 from public.bans where user_id in (other, (select auth.uid())))
    and not exists (select 1 from public.blocks b where (b.blocker = other and b.blocked = (select auth.uid())) or (b.blocker = (select auth.uid()) and b.blocked = other))
    and not exists (select 1 from public.profiles where id = other and calls_off)
    and exists (
      select 1 from public.capsules c
      where ((c.author = other and c.responder = (select auth.uid())) or (c.responder = other and c.author = (select auth.uid())))
        and exists (select 1 from public.messages m where m.capsule_id = c.id and m.sender = other)
        and exists (select 1 from public.messages m where m.capsule_id = c.id and m.sender = (select auth.uid()))
    )
$$;
revoke all on function private.can_call(uuid) from public, anon;
grant execute on function private.can_call(uuid) to authenticated;

create table if not exists public.call_signals (
  id bigint generated always as identity primary key,
  call_id uuid not null,
  from_user uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('offer','answer','ice','end','decline','busy')),
  payload jsonb not null default '{}'::jsonb check (octet_length(payload::text) <= 20000),
  created_at timestamptz not null default now()
);
create index if not exists call_signals_to_idx on public.call_signals (to_user, created_at);
create index if not exists call_signals_call_idx on public.call_signals (call_id);
alter table public.call_signals enable row level security;
grant select, insert, delete on public.call_signals to authenticated;

create or replace function private.call_open(c uuid, a uuid, b uuid) returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.call_signals s where s.call_id = c and s.kind = 'offer' and s.created_at > now() - interval '3 hours'
    and ((s.from_user = a and s.to_user = b) or (s.from_user = b and s.to_user = a)))
$$;
revoke all on function private.call_open(uuid, uuid, uuid) from public, anon;
grant execute on function private.call_open(uuid, uuid, uuid) to authenticated;
create policy "calls: read own" on public.call_signals for select to authenticated using (from_user = (select auth.uid()) or to_user = (select auth.uid()));
create policy "calls: send" on public.call_signals for insert to authenticated with check (
  from_user = (select auth.uid()) and to_user <> from_user and (
    (kind = 'offer' and private.can_call(to_user))
    or (kind <> 'offer' and private.call_open(call_id, from_user, to_user))
  ));
create policy "calls: delete own" on public.call_signals for delete to authenticated using (from_user = (select auth.uid()) or to_user = (select auth.uid()));

create or replace function private.call_signal_guard() returns trigger language plpgsql security definer set search_path to 'public' as $$ begin
  if new.kind = 'offer' and (select count(*) from call_signals where from_user = new.from_user and kind = 'offer' and created_at > now() - interval '1 hour') >= 20 then raise exception 'call-limit' using errcode = 'P0001'; end if;
  if new.kind = 'ice' and (select count(*) from call_signals where call_id = new.call_id and from_user = new.from_user and kind = 'ice') >= 60 then return null; end if;
  return new;
end $$;
create trigger call_signals_guard before insert on public.call_signals for each row execute function private.call_signal_guard();
create or replace function private.on_call_push() returns trigger language plpgsql security definer set search_path to 'public', 'vault', 'extensions' as $$
begin
  perform net.http_post(
    url := 'https://mrivbqkqdaxtvwcsljzu.supabase.co/functions/v1/push',
    body := json_build_object('call_signal_id', new.id)::jsonb,
    headers := json_build_object('Content-Type', 'application/json',
      'x-push-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'iskra_push_hook'))::jsonb,
    timeout_milliseconds := 5000);
  return new;
exception when others then return new;
end $$;
create trigger call_signals_push after insert on public.call_signals for each row when (new.kind = 'offer') execute function private.on_call_push();
alter publication supabase_realtime add table public.call_signals;

-- Безопасность: фиксированный search_path у проверки интересов
alter function private.tags_ok set search_path = '';

-- Голосовые сообщения в личных чатах: файл в хранилище chat/<id чата>/, длина до 3 минут.
alter table public.messages add column if not exists audio_path text, add column if not exists audio_ms integer;
alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages add constraint messages_content_check check (char_length(body) <= 2000 and (char_length(body) >= 1 or photo_path is not null or audio_path is not null));
alter table public.messages drop constraint if exists messages_audio_check;
alter table public.messages add constraint messages_audio_check check (audio_path is null or (char_length(audio_path) <= 200 and audio_path like capsule_id::text || '/%' and audio_ms between 300 and 180000));
update storage.buckets set allowed_mime_types = array['image/jpeg','image/png','image/webp','audio/mp4','audio/webm','audio/ogg','audio/mpeg','audio/aac'] where id = 'chat';

-- «В сети»: отдельная таблица (не profiles — её изменения перезагружают данные у всех).
-- Приложение раз в 45 секунд отмечается через touch_seen(true); свернули — touch_seen(false).
create table if not exists public.presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  seen_at timestamptz not null default now(),
  online_until timestamptz
);
alter table public.presence enable row level security;
drop policy if exists "presence: read" on public.presence;
create policy "presence: read" on public.presence for select to authenticated using (true);
create or replace function public.touch_seen(on_line boolean) returns void
language sql security definer set search_path = '' as $$
  insert into public.presence (user_id, seen_at, online_until)
  values ((select auth.uid()), now(), case when on_line then now() + interval '90 seconds' end)
  on conflict (user_id) do update set seen_at = excluded.seen_at, online_until = excluded.online_until
$$;
revoke all on function public.touch_seen(boolean) from public, anon;
grant execute on function public.touch_seen(boolean) to authenticated;

-- «Сохранить» публикацию (фото или видео): видно только самому человеку.
create table if not exists public.saved_shorts (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  short_id uuid not null references public.shorts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, short_id)
);
create index if not exists saved_shorts_short_idx on public.saved_shorts (short_id);
alter table public.saved_shorts enable row level security;
revoke all on public.saved_shorts from anon, authenticated;
grant select, delete on public.saved_shorts to authenticated;
grant insert (short_id) on public.saved_shorts to authenticated;
drop policy if exists "saved shorts: own" on public.saved_shorts;
create policy "saved shorts: own" on public.saved_shorts for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Оформление профиля: акцентный цвет, обложка, кольцо аватарки и статус под именем.
alter table public.profiles add column if not exists style jsonb not null default '{}';
alter table public.profiles drop constraint if exists profiles_style_check;
alter table public.profiles add constraint profiles_style_check check (jsonb_typeof(style) = 'object' and octet_length(style::text) <= 1000);
grant insert (style), update (style) on public.profiles to authenticated;

-- Когда человек последний раз открывал уведомления — на сервере, чтобы на всех устройствах они были просмотрены.
alter table public.profile_private add column if not exists notices_seen_at timestamptz;

-- Админ: бан на срок (until пусто — навсегда).
alter table public.bans add column if not exists until timestamptz;
create or replace function private.is_banned(u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.bans where user_id = u and (until is null or until > now()))
$$;

-- Админ: поправить имя и «о себе», убрать фото (например, за неприличное).
create or replace function public.admin_update_profile(u uuid, new_name text, new_bio text, clear_photo boolean default false) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update profiles set
    name = coalesce(nullif(left(trim(new_name), 40), ''), name),
    bio = left(coalesce(new_bio, bio), 500),
    photo = case when clear_photo then null else photo end,
    photo_path = case when clear_photo then null else photo_path end
  where id = u;
end $$;
revoke all on function public.admin_update_profile(uuid, text, text, boolean) from public, anon;
grant execute on function public.admin_update_profile(uuid, text, text, boolean) to authenticated;

-- Удаление аккаунта целиком — серверная функция admin-delete-user (через Auth API, с проверкой, что вызывает админ).

-- Админ: push-уведомление одному человеку или всем (target пусто).
create or replace function public.admin_push(title text, body text, target uuid default null) returns void
language plpgsql security definer set search_path = public, vault, extensions as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if coalesce(trim(body), '') = '' then raise exception 'empty' using errcode = 'P0001'; end if;
  perform net.http_post(
    url := 'https://mrivbqkqdaxtvwcsljzu.supabase.co/functions/v1/push',
    body := json_build_object('broadcast', json_build_object('title', left(coalesce(nullif(trim(title), ''), 'Komeeta'), 60), 'body', left(trim(body), 300)), 'target', target)::jsonb,
    headers := json_build_object('Content-Type', 'application/json',
      'x-push-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'iskra_push_hook'))::jsonb,
    timeout_milliseconds := 8000
  );
end $$;
revoke all on function public.admin_push(text, text, uuid) from public, anon;
grant execute on function public.admin_push(text, text, uuid) to authenticated;

-- Админ: до какого времени бан (пусто — навсегда).
create or replace function public.admin_ban_until(u uuid) returns timestamptz
language sql stable security definer set search_path = public as $$
  select case when private.is_admin() then (select until from bans where user_id = u) end
$$;
revoke all on function public.admin_ban_until(uuid) from public, anon;
grant execute on function public.admin_ban_until(uuid) to authenticated;

-- Амбассадоры города: помощники, которые запускают встречи. Значок видят все; ставит и снимает только админ.
create table if not exists public.ambassadors (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  city text not null default '' check (char_length(city) <= 60),
  granted_at timestamptz not null default now(),
  active boolean not null default true
);
alter table public.ambassadors enable row level security;
revoke all on public.ambassadors from anon, authenticated;
grant select on public.ambassadors to authenticated;
drop policy if exists "ambassadors: read" on public.ambassadors;
create policy "ambassadors: read" on public.ambassadors for select to authenticated using (true);
create or replace function public.admin_set_ambassador(u uuid, on_off boolean, city text default '') returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  insert into ambassadors (user_id, city, active) values (u, left(coalesce(city, ''), 60), on_off)
  on conflict (user_id) do update set active = excluded.active,
    city = case when excluded.active then excluded.city else ambassadors.city end,
    granted_at = case when excluded.active and not ambassadors.active then now() else ambassadors.granted_at end;
end $$;
revoke all on function public.admin_set_ambassador(uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_ambassador(uuid, boolean, text) to authenticated;

-- Достижения: выдаются только сервером (check_achievements считает по данным базы), подделать нельзя. Видны всем.
create table if not exists public.achievements (
  user_id uuid not null references public.profiles (id) on delete cascade,
  code text not null check (char_length(code) <= 40),
  earned_at timestamptz not null default now(),
  primary key (user_id, code)
);
alter table public.achievements enable row level security;
revoke all on public.achievements from anon, authenticated;
grant select on public.achievements to authenticated;
drop policy if exists "achievements: read" on public.achievements;
create policy "achievements: read" on public.achievements for select to authenticated using (true);

-- Проверить мои достижения и выдать новые; возвращает коды только что полученных.
create or replace function public.check_achievements() returns setof text
language plpgsql security definer set search_path = public as $$
declare
  me uuid := (select auth.uid());
  met int; got text[] := '{}';
begin
  if me is null then return; end if;
  select count(*) into met from capsules where status = 'met' and me in (author, responder);
  if exists (select 1 from profiles p where p.id = me and p.photo_path is not null and char_length(p.bio) > 0 and coalesce(array_length(p.tags, 1), 0) >= 3 and p.district <> '') then got := array_append(got, 'profile_full'); end if;
  if exists (select 1 from plans where author = me) then got := array_append(got, 'first_plan'); end if;
  if (select count(distinct c.plan_id) from capsules c join plans pl on pl.id = c.plan_id where pl.author = me) >= 5 then got := array_append(got, 'soul'); end if;
  if met >= 1 then got := array_append(got, 'first_meet'); end if;
  if met >= 10 then got := array_append(got, 'regular'); end if;
  if (select count(*) from referrals where inviter = me) >= 3 then got := array_append(got, 'guide'); end if;
  if (select count(*) from shorts where author = me) >= 10 then got := array_append(got, 'author'); end if;
  if met >= 5 and not exists (select 1 from no_shows n join capsules c on c.id = n.capsule_id and c.status <> 'met' where n.target = me) then got := array_append(got, 'reliable'); end if;
  if exists (select 1 from capsules c join plans pl on pl.id = c.plan_id where c.status = 'met' and me in (c.author, c.responder)
    and extract(hour from pl.starts_at at time zone 'Europe/Minsk') >= 22) then got := array_append(got, 'night_owl'); end if;
  if exists (select 1 from capsules c join plans pl on pl.id = c.plan_id where c.status = 'met' and me in (c.author, c.responder)
    and extract(hour from pl.starts_at at time zone 'Europe/Minsk') < 9) then got := array_append(got, 'early_bird'); end if;
  if exists (select 1 from ambassadors where user_id = me and active) then got := array_append(got, 'ambassador'); end if;
  if exists (select 1 from founders where user_id = me) then got := array_append(got, 'founder'); end if;
  return query
    with ins as (insert into achievements (user_id, code) select me, x from unnest(got) x on conflict do nothing returning achievements.code)
    select ins.code from ins;
end $$;
revoke all on function public.check_achievements() from public, anon;
grant execute on function public.check_achievements() to authenticated;

-- Прогресс к достижениям (мой) и их редкость (у скольких людей есть).
create or replace function public.achievement_progress() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'met', (select count(*) from capsules where status = 'met' and (select auth.uid()) in (author, responder)),
    'responded', (select count(distinct c.plan_id) from capsules c join plans pl on pl.id = c.plan_id where pl.author = (select auth.uid())),
    'invites', (select count(*) from referrals where inviter = (select auth.uid())),
    'noshows', (select count(*) from no_shows n join capsules c on c.id = n.capsule_id and c.status <> 'met' where n.target = (select auth.uid()))
  )
$$;
revoke all on function public.achievement_progress() from public, anon;
grant execute on function public.achievement_progress() to authenticated;
create or replace function public.achievement_stats() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'total', (select count(*) from profiles),
    'by_code', coalesce((select json_object_agg(code, n) from (select code, count(*) n from achievements group by code) t), '{}'::json)
  )
$$;
revoke all on function public.achievement_stats() from public, anon;
grant execute on function public.achievement_stats() to authenticated;

-- Коллекция: собрал все 5 медалей — особая медаль «Комета» (collector).
create or replace function public.check_achievements() returns setof text
language plpgsql security definer set search_path = public as $$
declare
  me uuid := (select auth.uid());
  met int; got text[] := '{}';
begin
  if me is null then return; end if;
  select count(*) into met from capsules where status = 'met' and me in (author, responder);
  if exists (select 1 from profiles p where p.id = me and p.photo_path is not null and char_length(p.bio) > 0 and coalesce(array_length(p.tags, 1), 0) >= 3 and p.district <> '') then got := array_append(got, 'profile_full'); end if;
  if exists (select 1 from plans where author = me) then got := array_append(got, 'first_plan'); end if;
  if (select count(distinct c.plan_id) from capsules c join plans pl on pl.id = c.plan_id where pl.author = me) >= 5 then got := array_append(got, 'soul'); end if;
  if met >= 1 then got := array_append(got, 'first_meet'); end if;
  if met >= 10 then got := array_append(got, 'regular'); end if;
  if (select count(*) from referrals where inviter = me) >= 3 then got := array_append(got, 'guide'); end if;
  if (select count(*) from shorts where author = me) >= 10 then got := array_append(got, 'author'); end if;
  if met >= 5 and not exists (select 1 from no_shows n join capsules c on c.id = n.capsule_id and c.status <> 'met' where n.target = me) then got := array_append(got, 'reliable'); end if;
  if exists (select 1 from capsules c join plans pl on pl.id = c.plan_id where c.status = 'met' and me in (c.author, c.responder)
    and extract(hour from pl.starts_at at time zone 'Europe/Minsk') >= 22) then got := array_append(got, 'night_owl'); end if;
  if exists (select 1 from capsules c join plans pl on pl.id = c.plan_id where c.status = 'met' and me in (c.author, c.responder)
    and extract(hour from pl.starts_at at time zone 'Europe/Minsk') < 9) then got := array_append(got, 'early_bird'); end if;
  if exists (select 1 from ambassadors where user_id = me and active) then got := array_append(got, 'ambassador'); end if;
  if exists (select 1 from founders where user_id = me) then got := array_append(got, 'founder'); end if;
  -- Вся коллекция из 5 медалей (полученных когда-либо) — особая медаль «Комета»
  if (select count(distinct c) from (select code as c from achievements where user_id = me union select unnest(got)) t
      where c in ('first_meet', 'soul', 'reliable', 'guide', 'regular')) = 5 then got := array_append(got, 'collector'); end if;
  return query
    with ins as (insert into achievements (user_id, code) select me, x from unnest(got) x on conflict do nothing returning achievements.code)
    select ins.code from ins;
end $$;
