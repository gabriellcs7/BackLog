-- Execute SOMENTE este arquivo no projeto existente. Não repita setup.sql.

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
