-- BackLog: execute este arquivo uma vez no SQL Editor do projeto existente.
-- Mantém perfis, reviews, diário e listas. Não repita setup.sql.

begin;
insert into public.games(id) values ('hollow-knight'),('hollow-knight-silksong') on conflict do nothing;
commit;


begin;

-- Only the owner can change their photo. Paths never contain arbitrary external URLs.
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles drop constraint if exists profiles_avatar_path_check;
alter table public.profiles add constraint profiles_avatar_path_check check (
    avatar_path is null or avatar_path ~ ('^' || id::text || '/[0-9a-f-]+\.webp$')
);
grant update(avatar_path) on public.profiles to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatars','avatars',true,524288,array['image/webp'])
on conflict(id) do update set public=true,file_size_limit=524288,allowed_mime_types=array['image/webp'];
drop policy if exists "Avatar owners insert" on storage.objects;
drop policy if exists "Avatar owners delete" on storage.objects;
drop policy if exists "Avatar owners update" on storage.objects;
drop policy if exists "Avatar photos are public" on storage.objects;
create policy "Avatar photos are public" on storage.objects for select to anon,authenticated using(bucket_id='avatars');
create policy "Avatar owners insert" on storage.objects for insert to authenticated with check(bucket_id='avatars' and split_part(name,'/',1)=auth.uid()::text);
create policy "Avatar owners update" on storage.objects for update to authenticated using(bucket_id='avatars' and split_part(name,'/',1)=auth.uid()::text) with check(bucket_id='avatars' and split_part(name,'/',1)=auth.uid()::text);
create policy "Avatar owners delete" on storage.objects for delete to authenticated using(bucket_id='avatars' and split_part(name,'/',1)=auth.uid()::text);

create table if not exists public.follows (
    follower_id uuid not null references public.profiles(id) on delete cascade,
    following_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key(follower_id,following_id),
    check(follower_id<>following_id)
);
create index if not exists follows_following_idx on public.follows(following_id,follower_id);
alter table public.follows enable row level security;
grant select on public.follows to anon,authenticated;
grant insert,delete on public.follows to authenticated;
drop policy if exists "Public follows" on public.follows;
drop policy if exists "Own follows insert" on public.follows;
drop policy if exists "Own follows delete" on public.follows;
create policy "Public follows" on public.follows for select to anon,authenticated using(true);
create policy "Own follows insert" on public.follows for insert to authenticated with check(follower_id=auth.uid());
create policy "Own follows delete" on public.follows for delete to authenticated using(follower_id=auth.uid());

create or replace function public.profile_social(profile_key uuid)
returns table(follower_count bigint,following_count bigint,is_following boolean)
language sql stable security invoker set search_path='' as $$
 select (select count(*) from public.follows where following_id=profile_key),
 (select count(*) from public.follows where follower_id=profile_key),
 exists(select 1 from public.follows where follower_id=auth.uid() and following_id=profile_key);
$$;
create or replace function public.set_profile_follow(profile_key uuid,should_follow boolean) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in to follow players.'; end if;
 if profile_key=auth.uid() then raise exception 'You cannot follow yourself.'; end if;
 if should_follow then
  insert into public.follows(follower_id,following_id) values(auth.uid(),profile_key) on conflict do nothing;
 else delete from public.follows where follower_id=auth.uid() and following_id=profile_key;
 end if;
end;
$$;
create or replace function public.profile_connections(profile_key uuid,connection_kind text,page_offset integer default 0)
returns table(id uuid,display_name text,avatar_path text)
language sql stable security invoker set search_path='' as $$
 select p.id,p.display_name,p.avatar_path from public.profiles p join public.follows f
 on p.id=case when connection_kind='followers' then f.follower_id else f.following_id end
 where (connection_kind='followers' and f.following_id=profile_key)
 or (connection_kind='following' and f.follower_id=profile_key)
 order by f.created_at desc,p.id limit 20 offset greatest(0,page_offset);
$$;

-- Invoker view preserves table RLS. No email or other auth.users fields are exposed.
create or replace view public.review_cards with(security_invoker=true) as
 select r.id,r.user_id,r.game_id,r.rating,r.text,r.created_at,r.updated_at,
 p.display_name,p.avatar_path,
 (select count(*) from public.review_likes l where l.review_id=r.id) as like_count,
 (select count(*) from public.review_comments c where c.review_id=r.id) as comment_count,
 exists(select 1 from public.review_likes l where l.review_id=r.id and l.user_id=auth.uid()) as liked
 from public.reviews r join public.profiles p on p.id=r.user_id;
grant select on public.review_cards to anon,authenticated;
create or replace function public.review_feed_v2(game_key text,page_offset integer default 0)
returns setof public.review_cards language sql stable security invoker set search_path='' as $$
 select * from public.review_cards where game_id=game_key order by created_at desc,id limit 20 offset greatest(0,page_offset);
$$;
create or replace function public.home_review_feed(feed_kind text default 'popular',page_offset integer default 0)
returns setof public.review_cards language sql stable security invoker set search_path='' as $$
 select c.* from public.review_cards c where length(trim(c.text))>0 and
 (feed_kind='popular' or (feed_kind='following' and exists(select 1 from public.follows f where f.follower_id=auth.uid() and f.following_id=c.user_id)))
 order by case when feed_kind='popular' then c.like_count else 0 end desc,c.created_at desc,c.id
 limit 6 offset greatest(0,page_offset);
$$;
create or replace function public.get_review_card(review_key uuid)
returns setof public.review_cards language sql stable security invoker set search_path='' as $$
 select * from public.review_cards where id=review_key;
$$;
revoke all on function public.profile_social(uuid),public.profile_connections(uuid,text,integer),public.set_profile_follow(uuid,boolean),public.review_feed_v2(text,integer),public.home_review_feed(text,integer),public.get_review_card(uuid) from public,anon,authenticated;
grant execute on function public.profile_social(uuid),public.profile_connections(uuid,text,integer),public.review_feed_v2(text,integer),public.home_review_feed(text,integer),public.get_review_card(uuid) to anon,authenticated;
grant execute on function public.set_profile_follow(uuid,boolean) to authenticated;
notify pgrst,'reload schema';
commit;

