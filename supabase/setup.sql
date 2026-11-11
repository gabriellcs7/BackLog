-- SOMENTE PARA PROJETOS NOVOS. Em um projeto existente, execute apenas a atualização específica.

-- 202611070001_social.sql
-- BackLog: execute uma vez no SQL Editor de um projeto Supabase novo.
begin;
create table public.games (id text primary key);
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null default 'Player' check (char_length(trim(display_name)) between 2 and 40),
    bio text not null default '' check (char_length(bio) <= 280),
    created_at timestamptz not null default now()
);
create table public.favorites (
    user_id uuid not null references public.profiles(id) on delete cascade,
    game_id text not null references public.games(id),
    position smallint not null check (position between 1 and 4),
    primary key (user_id, position), unique (user_id, game_id)
);
create table public.game_lists (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    name text not null check (char_length(trim(name)) between 1 and 80),
    description text not null default '' check (char_length(description) <= 500),
    is_public boolean not null default false,
    created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.list_games (
    list_id uuid not null references public.game_lists(id) on delete cascade,
    game_id text not null references public.games(id),
    position smallint not null check (position between 1 and 100),
    primary key (list_id, game_id), unique (list_id, position)
);
create table public.reviews (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    game_id text not null references public.games(id),
    rating numeric(2,1) check (rating between 0 and 5 and rating * 2 = trunc(rating * 2)),
    text text not null default '' check (char_length(text) <= 3000),
    created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
    unique (user_id, game_id), check (rating is not null or char_length(trim(text)) > 0)
);
create table public.review_likes (
    review_id uuid not null references public.reviews(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now(), primary key (review_id, user_id)
);
create table public.review_comments (
    id uuid primary key default gen_random_uuid(),
    review_id uuid not null references public.reviews(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    text text not null check (char_length(trim(text)) between 1 and 1000),
    created_at timestamptz not null default now()
);
create index reviews_game_date on public.reviews(game_id, created_at desc, id);
create index comments_review_date on public.review_comments(review_id, created_at, id);
create index game_lists_user on public.game_lists(user_id);
create index likes_user on public.review_likes(user_id);
create function public.create_player_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
    insert into public.profiles (id, display_name) values (new.id,
        case when char_length(trim(coalesce(new.raw_user_meta_data->>'display_name',''))) >= 2
        then left(trim(new.raw_user_meta_data->>'display_name'),40) else 'Player' end);
    return new;
end;
$$;
create trigger on_backlog_signup after insert on auth.users for each row execute function public.create_player_profile();
-- Cria perfis para usuários que já existiam no projeto.
insert into public.profiles(id) select id from auth.users on conflict do nothing;
alter table public.games enable row level security;
alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.game_lists enable row level security;
alter table public.list_games enable row level security;
alter table public.reviews enable row level security;
alter table public.review_likes enable row level security;
alter table public.review_comments enable row level security;
create policy games_read on public.games for select to anon, authenticated using (true);
create policy profiles_read on public.profiles for select to anon, authenticated using (true);
create policy profile_update on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy favorites_read on public.favorites for select to anon, authenticated using (true);
create policy favorites_insert on public.favorites for insert to authenticated with check ((select auth.uid()) = user_id);
create policy favorites_delete on public.favorites for delete to authenticated using ((select auth.uid()) = user_id);
create policy lists_read on public.game_lists for select to anon, authenticated using (is_public or (select auth.uid()) = user_id);
create policy lists_insert on public.game_lists for insert to authenticated with check ((select auth.uid()) = user_id);
create policy lists_update on public.game_lists for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy lists_delete on public.game_lists for delete to authenticated using ((select auth.uid()) = user_id);
create policy list_games_read on public.list_games for select to anon, authenticated using (exists (select 1 from public.game_lists l where l.id = list_id and (l.is_public or l.user_id = (select auth.uid()))));
create policy list_games_insert on public.list_games for insert to authenticated with check (exists (select 1 from public.game_lists l where l.id = list_id and l.user_id = (select auth.uid())));
create policy list_games_delete on public.list_games for delete to authenticated using (exists (select 1 from public.game_lists l where l.id = list_id and l.user_id = (select auth.uid())));
create policy reviews_read on public.reviews for select to anon, authenticated using (true);
create policy reviews_insert on public.reviews for insert to authenticated with check ((select auth.uid()) = user_id);
create policy reviews_update on public.reviews for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy reviews_delete on public.reviews for delete to authenticated using ((select auth.uid()) = user_id);
create policy likes_read on public.review_likes for select to anon, authenticated using (true);
create policy likes_insert on public.review_likes for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.reviews r where r.id = review_id and r.user_id <> (select auth.uid())));
create policy likes_delete on public.review_likes for delete to authenticated using ((select auth.uid()) = user_id);
create policy comments_read on public.review_comments for select to anon, authenticated using (true);
create policy comments_insert on public.review_comments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy comments_delete on public.review_comments for delete to authenticated using ((select auth.uid()) = user_id);
-- Funções com security invoker: as políticas do usuário continuam valendo.
create function public.set_favorites(game_ids text[]) returns void language plpgsql security invoker set search_path = '' as $$
begin
    if auth.uid() is null then raise exception 'Sign in first'; end if;
    if game_ids is null or cardinality(game_ids) > 4 or exists(select 1 from unnest(game_ids) g where g is null) or cardinality(game_ids) <> (select count(distinct g) from unnest(game_ids) g) then raise exception 'Choose up to four different games'; end if;
    delete from public.favorites where user_id = auth.uid();
    insert into public.favorites(user_id, game_id, position) select auth.uid(), game_id, position from unnest(game_ids) with ordinality as t(game_id,position);
end;
$$;
create function public.save_game_list(list_id uuid, list_name text, list_description text, public_list boolean, game_ids text[]) returns uuid language plpgsql security invoker set search_path = '' as $$
declare result uuid;
begin
    if auth.uid() is null then raise exception 'Sign in first'; end if;
    if game_ids is null or cardinality(game_ids) > 100 or exists(select 1 from unnest(game_ids) g where g is null) or cardinality(game_ids) <> (select count(distinct g) from unnest(game_ids) g) then raise exception 'Invalid games'; end if;
    if list_id is null then
        insert into public.game_lists(user_id,name,description,is_public) values(auth.uid(),trim(list_name),list_description,public_list) returning id into result;
    else
        update public.game_lists set name=trim(list_name),description=list_description,is_public=public_list,updated_at=now() where id=list_id and user_id=auth.uid() returning id into result;
        if result is null then raise exception 'List not found'; end if;
    end if;
    delete from public.list_games where public.list_games.list_id=result;
    insert into public.list_games(list_id,game_id,position) select result,game_id,position from unnest(game_ids) with ordinality as t(game_id,position);
    return result;
end;
$$;
revoke all on public.games, public.profiles, public.favorites, public.game_lists, public.list_games, public.reviews, public.review_likes, public.review_comments from anon, authenticated;
grant select on public.games, public.profiles, public.favorites, public.game_lists, public.list_games, public.reviews, public.review_likes, public.review_comments to anon, authenticated;
grant update(display_name,bio) on public.profiles to authenticated;
grant insert,delete on public.favorites, public.list_games, public.review_likes, public.review_comments to authenticated;
grant insert,delete on public.game_lists, public.reviews to authenticated;
grant update(name,description,is_public,updated_at) on public.game_lists to authenticated;
grant update(rating,text,updated_at) on public.reviews to authenticated;
revoke all on function public.create_player_profile() from public;
revoke all on function public.set_favorites(text[]) from public;
revoke all on function public.save_game_list(uuid,text,text,boolean,text[]) from public;
grant execute on function public.set_favorites(text[]) to authenticated;
grant execute on function public.save_game_list(uuid,text,text,boolean,text[]) to authenticated;
-- O catálogo aceito pelo servidor é o mesmo usado no site.

insert into public.games(id) values
('grand-theft-auto-vi'),
('grand-theft-auto-v'),
('red-dead-redemption-2'),
('god-of-war-ragnarok'),
('the-last-of-us'),
('minecraft'),
('fortnite'),
('spider-man'),
('red-dead-redemption'),
('phantom-blade-zero'),
('silent-hill-townfall'),
('minecraft-dungeons-ii'),
('spider-man-miles-morales'),
('spider-man-2'),
('god-of-war-2005'),
('god-of-war-ii'),
('god-of-war-iii'),
('god-of-war-ascension'),
('god-of-war-2018'),
('grand-theft-auto'),
('grand-theft-auto-2'),
('grand-theft-auto-iii'),
('gta-vice-city'),
('gta-san-andreas'),
('grand-theft-auto-iv'),
('the-last-of-us-part-ii'),
('league-of-legends'),
('overwatch-1'),
('overwatch-2'),
('resident-evil-1996'),
('resident-evil-2-1998'),
('resident-evil-3-nemesis'),
('resident-evil-code-veronica'),
('resident-evil-zero'),
('resident-evil-4-2005'),
('resident-evil-5'),
('resident-evil-6'),
('resident-evil-7'),
('resident-evil-village'),
('resident-evil-requiem');
commit;


-- 202611070002_review_feed.sql
begin;
-- Paginação e contagens calculadas no servidor, sem limite de likes no navegador.
create function public.review_feed(game_key text, page_offset integer default 0)
returns table(id uuid,user_id uuid,game_id text,rating numeric,text text,created_at timestamptz,updated_at timestamptz,display_name text,like_count bigint,comment_count bigint,liked boolean)
language sql stable security invoker set search_path = '' as $$
    select r.id,r.user_id,r.game_id,r.rating,r.text,r.created_at,r.updated_at,p.display_name,
    (select count(*) from public.review_likes l where l.review_id=r.id),
    (select count(*) from public.review_comments c where c.review_id=r.id),
    exists(select 1 from public.review_likes l where l.review_id=r.id and l.user_id=auth.uid())
    from public.reviews r join public.profiles p on p.id=r.user_id
    where r.game_id=game_key order by r.created_at desc,r.id limit 20 offset greatest(0,page_offset);
$$;
create function public.set_review_like(review_key uuid, liked boolean) returns bigint
language plpgsql security invoker set search_path = '' as $$
declare result bigint;
begin
    if auth.uid() is null then raise exception 'Sign in first'; end if;
    if liked then insert into public.review_likes(review_id,user_id) values(review_key,auth.uid()) on conflict do nothing;
    else delete from public.review_likes where review_id=review_key and user_id=auth.uid(); end if;
    select count(*) into result from public.review_likes where review_id=review_key;
    return result;
end;
$$;
revoke all on function public.review_feed(text,integer) from public;
revoke all on function public.set_review_like(uuid,boolean) from public;
grant execute on function public.review_feed(text,integer) to anon,authenticated;
grant execute on function public.set_review_like(uuid,boolean) to authenticated;
commit;


-- 202611070003_diary.sql
-- Atualização do diário. Execute SOMENTE este arquivo no projeto BackLog existente.
begin;
alter table public.reviews add column reviewed_on date;
create table public.diary_entries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    game_id text not null references public.games(id),
    review_id uuid not null references public.reviews(id) on delete cascade,
    rating numeric(2,1) check (rating between 0 and 5 and rating * 2 = trunc(rating * 2)),
    text text not null default '' check (char_length(text) <= 3000),
    reviewed_on date not null check (reviewed_on >= date '1900-01-01' and reviewed_on <= current_date + 1),
    created_at timestamptz not null default now(),
    check (rating is not null or char_length(trim(text)) > 0)
);
alter table public.reviews add column diary_entry_id uuid references public.diary_entries(id) on delete set null;
create index diary_owner_date on public.diary_entries(user_id,reviewed_on desc,created_at desc,id);
create index diary_review on public.diary_entries(review_id);
alter table public.diary_entries enable row level security;
create policy diary_read on public.diary_entries for select to authenticated using ((select auth.uid())=user_id);
create policy diary_insert on public.diary_entries for insert to authenticated with check ((select auth.uid())=user_id and exists(select 1 from public.reviews r where r.id=review_id and r.user_id=(select auth.uid()) and r.game_id=diary_entries.game_id));
create policy diary_update on public.diary_entries for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy diary_delete on public.diary_entries for delete to authenticated using ((select auth.uid())=user_id);
revoke all on public.diary_entries from anon,authenticated;
grant select,insert,delete on public.diary_entries to authenticated;
grant update(reviewed_on) on public.diary_entries to authenticated;
grant update(reviewed_on,diary_entry_id) on public.reviews to authenticated;
-- Um registro inicial para cada avaliação antiga. Datas antigas disponíveis usam Fortaleza.
insert into public.diary_entries(user_id,game_id,review_id,rating,text,reviewed_on,created_at)
select user_id,game_id,id,rating,text,(updated_at at time zone 'America/Fortaleza')::date,updated_at from public.reviews;
update public.reviews r set reviewed_on=d.reviewed_on,diary_entry_id=d.id from public.diary_entries d where d.review_id=r.id;
create function public.save_review_log(game_key text,review_rating numeric,review_text text,log_date date)
returns setof public.reviews language plpgsql security invoker set search_path = '' as $$
declare saved public.reviews; entry_id uuid;
begin
    if auth.uid() is null then raise exception 'Sign in first'; end if;
    if log_date is null or log_date < date '1900-01-01' or log_date > current_date + 1 then raise exception 'Choose a valid diary date'; end if;
    if review_rating is not null and (review_rating < 0 or review_rating > 5 or review_rating * 2 <> trunc(review_rating * 2)) then raise exception 'Choose a rating in half-star steps'; end if;
    if review_text is null or char_length(review_text)>3000 or (review_rating is null and char_length(trim(review_text))=0) then raise exception 'Choose a rating or write a review'; end if;
    insert into public.reviews(user_id,game_id,rating,text,reviewed_on,updated_at)
    values(auth.uid(),game_key,review_rating,trim(review_text),log_date,now())
    on conflict(user_id,game_id) do update set rating=excluded.rating,text=excluded.text,reviewed_on=excluded.reviewed_on,updated_at=now()
    returning * into saved;
    insert into public.diary_entries(user_id,game_id,review_id,rating,text,reviewed_on)
    values(auth.uid(),game_key,saved.id,saved.rating,saved.text,log_date) returning id into entry_id;
    update public.reviews set diary_entry_id=entry_id where id=saved.id returning * into saved;
    return next saved;
end;
$$;
create function public.set_diary_date(entry_key uuid,new_date date) returns void
language plpgsql security invoker set search_path = '' as $$
declare entry public.diary_entries;
begin
    if auth.uid() is null then raise exception 'Sign in first'; end if;
    if new_date is null or new_date < date '1900-01-01' or new_date > current_date+1 then raise exception 'Choose a valid diary date'; end if;
    update public.diary_entries set reviewed_on=new_date where id=entry_key and user_id=auth.uid() returning * into entry;
    if entry.id is null then raise exception 'Diary entry not found'; end if;
    update public.reviews set reviewed_on=new_date where id=entry.review_id and user_id=auth.uid() and diary_entry_id=entry.id;
end;
$$;
revoke all on function public.save_review_log(text,numeric,text,date) from public,anon,authenticated;
revoke all on function public.set_diary_date(uuid,date) from public,anon,authenticated;
grant execute on function public.save_review_log(text,numeric,text,date) to authenticated;
grant execute on function public.set_diary_date(uuid,date) to authenticated;
notify pgrst,'reload schema';
commit;


-- 202611090001_ranked_lists.sql
begin;
-- Atualização segura para listas existentes: todas começam sem ranking.
alter table public.game_lists add column if not exists is_ranked boolean not null default false;
grant update(is_ranked) on public.game_lists to authenticated;
create or replace function public.save_game_list_v2(list_id uuid,list_name text,list_description text,public_list boolean,ranked_list boolean,game_ids text[])
returns uuid language plpgsql security invoker set search_path = '' as $$
declare result uuid;
begin
    if auth.uid() is null then raise exception 'Sign in first'; end if;
    if ranked_list is null or public_list is null then raise exception 'Choose a list type and visibility'; end if;
    if game_ids is null or cardinality(game_ids)>100 or exists(select 1 from unnest(game_ids) g where g is null) or cardinality(game_ids)<>(select count(distinct g) from unnest(game_ids) g) then raise exception 'Choose different games from the catalog'; end if;
    if list_id is null then
        insert into public.game_lists(user_id,name,description,is_public,is_ranked)
        values(auth.uid(),trim(list_name),list_description,public_list,ranked_list) returning id into result;
    else
        update public.game_lists set name=trim(list_name),description=list_description,is_public=public_list,is_ranked=ranked_list,updated_at=now()
        where id=list_id and user_id=auth.uid() returning id into result;
        if result is null then raise exception 'List not found'; end if;
    end if;
    delete from public.list_games where public.list_games.list_id=result;
    insert into public.list_games(list_id,game_id,position)
    select result,game_id,position from unnest(game_ids) with ordinality as t(game_id,position);
    return result;
end;
$$;
revoke all on function public.save_game_list_v2(uuid,text,text,boolean,boolean,text[]) from public,anon,authenticated;
grant execute on function public.save_game_list_v2(uuid,text,text,boolean,boolean,text[]) to authenticated;
notify pgrst,'reload schema';
commit;


-- 202611100001_hollow_knight.sql
begin;
insert into public.games(id) values ('hollow-knight'),('hollow-knight-silksong') on conflict do nothing;
commit;


-- 202611100002_profiles_social_feeds.sql
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


-- 202611100003_discovery.sql
begin;
-- Four most-liked written reviews; the following feed keeps only each author's latest.
create or replace function public.home_review_feed(feed_kind text default 'popular',page_offset integer default 0)
returns setof public.review_cards language sql stable security invoker set search_path='' as $$
 with latest_followed as (
  select distinct on(c.user_id) c.* from public.review_cards c
  where length(trim(c.text))>0 and exists(
   select 1 from public.follows f where f.follower_id=auth.uid() and f.following_id=c.user_id
  ) order by c.user_id,c.created_at desc,c.id desc
 ), eligible as (
  select c.* from public.review_cards c where feed_kind='popular' and length(trim(c.text))>0 and c.like_count>0
  union all
  select c.* from latest_followed c where feed_kind='following'
 )
 select * from eligible
 order by case when feed_kind='popular' then like_count else 0 end desc,created_at desc,id desc
 limit case when feed_kind='popular' then 4 else 6 end offset greatest(0,page_offset);
$$;

-- Literal substring search: no email addresses or wildcard interpretation.
create or replace function public.search_players(search_term text,page_offset integer default 0)
returns table(id uuid,display_name text,avatar_path text)
language sql stable security invoker set search_path='' as $$
 select p.id,p.display_name,p.avatar_path from public.profiles p
 where length(trim(search_term)) between 2 and 120
 and position(lower(trim(search_term)) in lower(p.display_name))>0
 order by case when lower(p.display_name)=lower(trim(search_term)) then 0 else 1 end,lower(p.display_name),p.id
 limit 12 offset greatest(0,page_offset);
$$;
revoke all on function public.search_players(text,integer) from public,anon,authenticated;
grant execute on function public.search_players(text,integer) to anon,authenticated;
notify pgrst,'reload schema';
commit;


-- 202611100004_activity.sql
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


-- Profile history
begin;
alter table public.rating_events add column if not exists review_number bigint;

-- Recover the order of written reviews from matching saves. Private diary dates and text stay private.
update public.rating_events e
set review_number = (
    select count(*) from public.diary_entries d
    where d.review_id=e.review_id and d.created_at<=e.created_at and btrim(d.text)<>''
)
where e.review_number is null and exists (
    select 1 from public.diary_entries d
    where d.review_id=e.review_id and d.created_at=e.created_at and btrim(d.text)<>''
);

create or replace function public.record_rating_activity() returns trigger
language plpgsql security definer set search_path='' as $$
declare review_number bigint;
begin
    if btrim(new.text)<>'' then
        select greatest(
            (select count(*) from public.diary_entries d where d.review_id=new.id and btrim(d.text)<>''),
            (select coalesce(max(e.review_number),0) from public.rating_events e where e.review_id=new.id)
        )+1 into review_number;
    end if;
    insert into public.rating_events(user_id,game_id,review_id,rating,created_at,review_number)
    values(new.user_id,new.game_id,new.id,new.rating,new.updated_at,review_number)
    on conflict do nothing;
    return new;
end;
$$;

create or replace function public.activity_feed_v2(page_offset integer default 0,feed_filter text default 'all')
returns table(id text,kind text,actor_id uuid,target_id uuid,game_id text,review_id uuid,rating numeric,status text,created_at timestamptz,display_name text,avatar_path text,target_name text,review_number bigint)
language sql stable security invoker set search_path='' as $$
 select e.*,p.display_name,p.avatar_path,t.display_name,numbered.review_number from public.activity_events e
 join public.profiles p on p.id=e.actor_id left join public.profiles t on t.id=e.target_id
 left join public.rating_events numbered on e.id='rating:'||numbered.id
 where auth.uid() is not null and e.actor_id<>auth.uid() and
 (e.target_id=auth.uid() or exists(select 1 from public.follows f where f.follower_id=auth.uid() and f.following_id=e.actor_id))
 and (feed_filter='all' or (feed_filter='you' and e.target_id=auth.uid()) or (feed_filter='following' and exists(select 1 from public.follows f where f.follower_id=auth.uid() and f.following_id=e.actor_id)))
 order by e.created_at desc,e.id limit 20 offset greatest(0,page_offset);
$$;
create or replace function public.profile_recent_games_v2(profile_key uuid)
returns table(game_id text,kind text,rating numeric,status text,created_at timestamptz,review_id uuid,review_number bigint)
language sql stable security invoker set search_path='' as $$
 select x.game_id,x.kind,x.rating,x.status,x.created_at,x.review_id,x.review_number from (
  select distinct on(e.game_id) e.* from (
   select game_id,'rating'::text as kind,rating,null::text as status,created_at,review_id,id,review_number from public.rating_events where user_id=profile_key
   union all select game_id,'status',null,status,created_at,null,id,null from public.status_events where user_id=profile_key
  ) e order by e.game_id,e.created_at desc,e.id desc
 ) x order by x.created_at desc,x.game_id limit 4;
$$;

create or replace function public.profile_logged_games(profile_key uuid)
returns table(game_id text) language sql stable security invoker set search_path='' as $$
    select r.game_id from public.reviews r where r.user_id=profile_key
    union
    select s.game_id from public.game_statuses s where s.user_id=profile_key and s.status<>'want-to-play'
    order by game_id;
$$;

create or replace function public.profile_public_diary(profile_key uuid,calendar_year integer default null,page_offset integer default 0)
returns table(id uuid,game_id text,rating numeric,status text,created_at timestamptz,public_date date,review_id uuid,review_number bigint)
language sql stable security invoker set search_path='' as $$
    with entries as (
        select e.id,e.game_id,e.rating,null::text as status,e.created_at,e.review_id,e.review_number
        from public.rating_events e where e.user_id=profile_key
        union all
        select s.id,s.game_id,null,s.status,s.created_at,null,null
        from public.status_events s where s.user_id=profile_key
    )
    select e.id,e.game_id,e.rating,e.status,e.created_at,(e.created_at at time zone 'America/Fortaleza')::date,e.review_id,e.review_number
    from entries e
    where calendar_year is null or extract(year from e.created_at at time zone 'America/Fortaleza')=calendar_year
    order by e.created_at desc,e.id
    limit 100 offset greatest(0,page_offset);
$$;
revoke all on function public.activity_feed_v2(integer,text),public.profile_recent_games_v2(uuid),public.profile_logged_games(uuid),public.profile_public_diary(uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.activity_feed_v2(integer,text) to authenticated;
grant execute on function public.profile_recent_games_v2(uuid),public.profile_logged_games(uuid),public.profile_public_diary(uuid,integer,integer) to anon,authenticated;
notify pgrst,'reload schema';
commit;
