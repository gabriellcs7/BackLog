begin;
-- A personal opinion about the game, separate from likes received by a review.
alter table public.reviews add column if not exists game_liked boolean not null default false;
alter table public.diary_entries add column if not exists game_liked boolean not null default false;
grant update(game_liked) on public.reviews, public.diary_entries to authenticated;

create or replace function public.save_review_with_heart(game_key text,review_rating numeric,review_text text,log_date date,game_liked_flag boolean)
returns setof public.reviews language plpgsql security invoker set search_path='' as $$
declare saved public.reviews;
begin
    if auth.uid() is null then raise exception 'Sign in first'; end if;
    if game_liked_flag is null then raise exception 'Choose a valid game heart'; end if;
    select * into saved from public.save_review_log(game_key,review_rating,review_text,log_date);
    if saved.id is null then raise exception 'Could not save review'; end if;
    update public.diary_entries set game_liked=game_liked_flag
      where id=saved.diary_entry_id and user_id=auth.uid();
    return query update public.reviews set game_liked=game_liked_flag
      where id=saved.id and user_id=auth.uid() returning *;
end;
$$;
revoke all on function public.save_review_with_heart(text,numeric,text,date,boolean) from public,anon,authenticated;
grant execute on function public.save_review_with_heart(text,numeric,text,date,boolean) to authenticated;
notify pgrst,'reload schema';
commit;
