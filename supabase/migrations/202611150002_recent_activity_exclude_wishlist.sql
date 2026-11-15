begin;
create or replace function public.profile_recent_games_v2(profile_key uuid)
returns table(game_id text,kind text,rating numeric,status text,created_at timestamptz,review_id uuid,review_number bigint)
language sql stable security invoker set search_path='' as $$
 select x.game_id,x.kind,x.rating,x.status,x.created_at,x.review_id,x.review_number from (
  select distinct on(e.game_id) e.* from (
   select game_id,'rating'::text as kind,rating,null::text as status,created_at,review_id,id,review_number from public.rating_events where user_id=profile_key
   union all select game_id,'status',null,status,created_at,null,id,null from public.status_events where user_id=profile_key and status <> 'want-to-play'
  ) e
  where not exists (
      select 1 from public.game_statuses s
      where s.user_id=profile_key and s.game_id=e.game_id and s.status='want-to-play'
  )
  order by e.game_id,e.created_at desc,e.id desc
 ) x order by x.created_at desc,x.game_id limit 4;
$$;

notify pgrst, 'reload schema';
commit;
