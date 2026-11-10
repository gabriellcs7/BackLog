-- Execute somente este arquivo no projeto existente; não repita setup.sql.

begin;
create table if not exists public.game_statuses(
 user_id uuid not null references public.profiles(id) on delete cascade,
 game_id text not null references public.games(id),
 status text not null check(status in ('played','playing','completed','platinum','dropped','want-to-play')),
 updated_at timestamptz not null default now(),primary key(user_id,game_id)
);
create table if not exists public.status_events(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 game_id text not null references public.games(id),status text not null,
 created_at timestamptz not null default now()
);
create table if not exists public.rating_events(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 game_id text not null references public.games(id),review_id uuid not null references public.reviews(id) on delete cascade,
 rating numeric,created_at timestamptz not null default now(),unique(review_id,created_at)
);
create index if not exists status_events_owner_date on public.status_events(user_id,created_at desc,id);
create index if not exists rating_events_owner_date on public.rating_events(user_id,created_at desc,id);
alter table public.game_statuses enable row level security;
alter table public.status_events enable row level security;
alter table public.rating_events enable row level security;
revoke all on public.game_statuses,public.status_events,public.rating_events from anon,authenticated;
grant select on public.game_statuses,public.status_events,public.rating_events to anon,authenticated;
drop policy if exists public_statuses on public.game_statuses;
drop policy if exists public_status_events on public.status_events;
drop policy if exists public_rating_events on public.rating_events;
create policy public_statuses on public.game_statuses for select using(true);
create policy public_status_events on public.status_events for select using(true);
create policy public_rating_events on public.rating_events for select using(true);

create or replace function public.save_game_status(game_key text,new_status text,initial_import boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare previous text;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if new_status is not null and new_status not in ('played','playing','completed','platinum','dropped','want-to-play') then raise exception 'Invalid status'; end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 select status into previous from public.game_statuses where user_id=auth.uid() and game_id=game_key for update;
 if initial_import and previous is not null then return; end if;
 if new_status is null then
  delete from public.game_statuses where user_id=auth.uid() and game_id=game_key;
  delete from public.status_events where user_id=auth.uid() and game_id=game_key;
 elsif previous is distinct from new_status then
  insert into public.game_statuses(user_id,game_id,status) values(auth.uid(),game_key,new_status)
  on conflict(user_id,game_id) do update set status=excluded.status,updated_at=now();
  if not initial_import then insert into public.status_events(user_id,game_id,status) values(auth.uid(),game_key,new_status); end if;
 end if;
end;
$$;
create or replace function public.my_game_statuses() returns setof public.game_statuses
language sql stable security invoker set search_path='' as $$select * from public.game_statuses where user_id=auth.uid();$$;
create or replace function public.record_rating_activity() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into public.rating_events(user_id,game_id,review_id,rating,created_at)
 values(new.user_id,new.game_id,new.id,new.rating,new.updated_at) on conflict do nothing;
 return new;
end;
$$;
revoke all on function public.record_rating_activity() from public,anon,authenticated;
drop trigger if exists review_activity on public.reviews;
create trigger review_activity after insert or update of rating,text,updated_at on public.reviews
 for each row execute function public.record_rating_activity();
insert into public.rating_events(user_id,game_id,review_id,rating,created_at)
select user_id,game_id,id,rating,updated_at from public.reviews on conflict do nothing;

create or replace view public.activity_events with(security_invoker=true) as
 select 'follow:'||f.follower_id||':'||f.following_id as id,'follow'::text as kind,f.follower_id as actor_id,f.following_id as target_id,
 null::text as game_id,null::uuid as review_id,null::numeric as rating,null::text as status,f.created_at from public.follows f
 union all select 'like:'||l.review_id||':'||l.user_id,'like',l.user_id,r.user_id,r.game_id,r.id,null,null,l.created_at
 from public.review_likes l join public.reviews r on r.id=l.review_id
 union all select 'comment:'||c.id,'comment',c.user_id,r.user_id,r.game_id,r.id,null,null,c.created_at
 from public.review_comments c join public.reviews r on r.id=c.review_id
 union all select 'rating:'||e.id,'rating',e.user_id,null,e.game_id,e.review_id,e.rating,null,e.created_at from public.rating_events e
 union all select 'status:'||e.id,'status',e.user_id,null,e.game_id,null,null,e.status,e.created_at from public.status_events e;
grant select on public.activity_events to authenticated;
create or replace function public.activity_feed(page_offset integer default 0,feed_filter text default 'all')
returns table(id text,kind text,actor_id uuid,target_id uuid,game_id text,review_id uuid,rating numeric,status text,created_at timestamptz,display_name text,avatar_path text,target_name text)
language sql stable security invoker set search_path='' as $$
 select e.*,p.display_name,p.avatar_path,t.display_name from public.activity_events e
 join public.profiles p on p.id=e.actor_id left join public.profiles t on t.id=e.target_id
 where auth.uid() is not null and e.actor_id<>auth.uid() and
 (e.target_id=auth.uid() or exists(select 1 from public.follows f where f.follower_id=auth.uid() and f.following_id=e.actor_id))
 and (feed_filter='all' or (feed_filter='you' and e.target_id=auth.uid()) or (feed_filter='following' and exists(select 1 from public.follows f where f.follower_id=auth.uid() and f.following_id=e.actor_id)))
 order by e.created_at desc,e.id limit 20 offset greatest(0,page_offset);
$$;
create or replace function public.profile_recent_games(profile_key uuid)
returns table(game_id text,kind text,rating numeric,status text,created_at timestamptz,review_id uuid)
language sql stable security invoker set search_path='' as $$
 select x.game_id,x.kind,x.rating,x.status,x.created_at,x.review_id from (
  select distinct on(e.game_id) e.* from (
   select game_id,'rating'::text as kind,rating,null::text as status,created_at,review_id,id from public.rating_events where user_id=profile_key
   union all select game_id,'status',null,status,created_at,null,id from public.status_events where user_id=profile_key
  ) e order by e.game_id,e.created_at desc,e.id desc
 ) x order by x.created_at desc,x.game_id limit 8;
$$;
-- Only aggregates are returned: diary entries and private lists remain private.
create or replace function public.profile_metrics(profile_key uuid,calendar_year integer)
returns table(played_this_year bigint,list_count bigint,logged_games bigint)
language sql stable security definer set search_path='' as $$
 select
 (select count(distinct game_id) from (
  select game_id from public.diary_entries where user_id=profile_key and extract(year from reviewed_on)=calendar_year
  union select game_id from public.status_events where user_id=profile_key and status<>'want-to-play' and extract(year from created_at at time zone 'America/Fortaleza')=calendar_year
 ) y),
 (select count(*) from public.game_lists where user_id=profile_key and (is_public or profile_key=auth.uid())),
 (select count(distinct game_id) from (
  select game_id from public.reviews where user_id=profile_key
  union select game_id from public.game_statuses where user_id=profile_key and status<>'want-to-play'
 ) g);
$$;
revoke all on function public.save_game_status(text,text,boolean),public.my_game_statuses(),public.activity_feed(integer,text),public.profile_recent_games(uuid),public.profile_metrics(uuid,integer) from public,anon,authenticated;
grant execute on function public.save_game_status(text,text,boolean),public.my_game_statuses(),public.activity_feed(integer,text) to authenticated;
grant execute on function public.profile_recent_games(uuid),public.profile_metrics(uuid,integer) to anon,authenticated;

-- Preserve the latest-per-author rule and change only the popular limit to three.
create or replace function public.home_review_feed(feed_kind text default 'popular',page_offset integer default 0)
returns setof public.review_cards language sql stable security invoker set search_path='' as $$
 with latest_followed as (
 select distinct on(c.user_id) c.* from public.review_cards c where length(trim(c.text))>0 and exists(select 1 from public.follows f where f.follower_id=auth.uid() and f.following_id=c.user_id)
 order by c.user_id,c.created_at desc,c.id desc
 ), eligible as (
 select c.* from public.review_cards c where feed_kind='popular' and length(trim(c.text))>0 and c.like_count>0
 union all select * from latest_followed where feed_kind='following'
 ) select * from eligible order by case when feed_kind='popular' then like_count else 0 end desc,created_at desc,id desc
 limit case when feed_kind='popular' then 3 else 6 end offset greatest(0,page_offset);
$$;
notify pgrst,'reload schema';
commit;
