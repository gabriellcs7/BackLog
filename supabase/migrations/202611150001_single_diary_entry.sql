begin;
grant update(rating,text) on public.diary_entries to authenticated;

create or replace function public.save_review_log(game_key text,review_rating numeric,review_text text,log_date date)
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
    update public.diary_entries
    set rating=saved.rating,text=saved.text,reviewed_on=log_date
    where id=saved.diary_entry_id and review_id=saved.id and user_id=auth.uid()
    returning id into entry_id;
    if entry_id is null then
        insert into public.diary_entries(user_id,game_id,review_id,rating,text,reviewed_on)
        values(auth.uid(),game_key,saved.id,saved.rating,saved.text,log_date) returning id into entry_id;
    end if;
    update public.reviews set diary_entry_id=entry_id where id=saved.id returning * into saved;
    return next saved;
end;
$$;

create or replace function public.profile_public_diary(profile_key uuid,calendar_year integer default null,page_offset integer default 0)
returns table(id uuid,game_id text,rating numeric,status text,created_at timestamptz,public_date date,review_id uuid,review_number bigint)
language sql stable security invoker set search_path='' as $$
    with joined as (
        select coalesce(r.id,latest.id) as id,coalesce(r.game_id,s.game_id) as game_id,
               r.rating,s.status,coalesce(r.updated_at,latest.created_at) as created_at,
               r.id as review_id,case when btrim(r.text)<>'' then 1::bigint end as review_number
        from (select * from public.reviews where user_id=profile_key) r
        full join (select * from public.game_statuses where user_id=profile_key) s on s.game_id=r.game_id
        left join lateral (
            select e.id,e.created_at from public.status_events e
            where e.game_id=s.game_id and e.user_id=profile_key
            order by e.created_at desc,e.id desc limit 1
        ) latest on r.id is null
    )
    select j.id,j.game_id,j.rating,j.status,j.created_at,
           (j.created_at at time zone 'America/Fortaleza')::date,j.review_id,j.review_number
    from joined j
    where j.id is not null
      and (calendar_year is null or extract(year from j.created_at at time zone 'America/Fortaleza')=calendar_year)
    order by j.created_at desc,j.id
    limit 100 offset greatest(0,page_offset);
$$;
notify pgrst, 'reload schema';
commit;
