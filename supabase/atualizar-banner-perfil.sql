begin;
alter table public.profiles
    add column if not exists banner_game_id text references public.games(id) on delete set null;
grant update(banner_game_id) on public.profiles to authenticated;
notify pgrst, 'reload schema';
commit;
