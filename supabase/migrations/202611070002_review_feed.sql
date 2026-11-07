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
