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
