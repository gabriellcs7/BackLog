begin;
-- Include the idempotent game-heart update so existing projects need only this file.
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

-- Editing a review updates the original event; its timestamp and identity stay intact.
create or replace function public.record_rating_activity() returns trigger
language plpgsql security definer set search_path='' as $$
declare event_key uuid;
begin
    if tg_op='UPDATE' and new.rating is not distinct from old.rating and new.text is not distinct from old.text then
        return new;
    end if;
    select e.id into event_key from public.rating_events e
    where e.review_id=new.id order by e.created_at,e.id limit 1;
    if event_key is null then
        insert into public.rating_events(user_id,game_id,review_id,rating,created_at,review_number)
        values(new.user_id,new.game_id,new.id,new.rating,new.created_at,case when btrim(new.text)<>'' then 1 end)
        on conflict do nothing;
    else
        update public.rating_events set rating=new.rating,
            review_number=case when btrim(new.text)<>'' then coalesce(review_number,1) else null end
        where id=event_key;
    end if;
    return new;
end;
$$;
revoke all on function public.record_rating_activity() from public,anon,authenticated;
drop trigger if exists review_activity on public.reviews;
create trigger review_activity after insert or update of rating,text,updated_at on public.reviews
for each row execute function public.record_rating_activity();

-- Recent activity uses when a review was created, never when its text was edited.
create or replace function public.profile_recent_games_v3(profile_key uuid)
returns table(game_id text,kind text,rating numeric,status text,created_at timestamptz,review_id uuid,review_number bigint)
language sql stable security invoker set search_path='' as $$
    with candidates as (
        select r.game_id,'rating'::text as kind,r.rating,null::text as status,r.created_at,r.id as review_id,
               case when btrim(r.text)<>'' then 1::bigint end as review_number,r.id
        from public.reviews r where r.user_id=profile_key
        union all
        select s.game_id,'status'::text,null::numeric,s.status,s.created_at,null::uuid,null::bigint,s.id
        from public.status_events s where s.user_id=profile_key and s.status not in ('want-to-play','playing')
    ), latest as (
        select distinct on(c.game_id) c.* from candidates c
        where not exists (
            select 1 from public.game_statuses s where s.user_id=profile_key and s.game_id=c.game_id
            and s.status in ('want-to-play','playing')
        )
        order by c.game_id,c.created_at desc,c.id desc
    )
    select l.game_id,l.kind,l.rating,l.status,l.created_at,l.review_id,l.review_number
    from latest l order by l.created_at desc,l.game_id limit 4;
$$;

-- Public diary reads public reviews only; private diary entries keep their existing RLS.
create or replace function public.profile_public_diary(profile_key uuid,calendar_year integer default null,page_offset integer default 0)
returns table(id uuid,game_id text,rating numeric,status text,created_at timestamptz,public_date date,review_id uuid,review_number bigint)
language sql stable security invoker set search_path='' as $$
    select r.id,r.game_id,r.rating,s.status,r.created_at,
           coalesce(r.reviewed_on,(r.created_at at time zone 'America/Fortaleza')::date),r.id,
           case when btrim(r.text)<>'' then 1::bigint end
    from public.reviews r left join public.game_statuses s on s.user_id=r.user_id and s.game_id=r.game_id
    where r.user_id=profile_key and r.rating is not null and r.rating>0
      and s.status is distinct from 'want-to-play'
      and (calendar_year is null or extract(year from coalesce(r.reviewed_on,(r.created_at at time zone 'America/Fortaleza')::date))=calendar_year)
    order by coalesce(r.reviewed_on,(r.created_at at time zone 'America/Fortaleza')::date) desc,r.created_at desc,r.id
    limit 100 offset greatest(0,page_offset);
$$;
revoke all on function public.profile_recent_games_v3(uuid),public.profile_public_diary(uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.profile_recent_games_v3(uuid),public.profile_public_diary(uuid,integer,integer) to anon,authenticated;
notify pgrst,'reload schema';
commit;
