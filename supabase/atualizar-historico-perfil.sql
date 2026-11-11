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
