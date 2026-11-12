begin;
alter table public.profiles
    add column if not exists location text not null default '' check (char_length(location)<=80),
    add column if not exists website text not null default '' check (
        char_length(website)<=300 and (website='' or website ~* '^https?://[^[:space:]]+$')
    );
grant update(location, website) on public.profiles to authenticated;
notify pgrst, 'reload schema';
commit;
