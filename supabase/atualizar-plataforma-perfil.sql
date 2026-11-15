begin;
alter table public.profiles add column if not exists gaming_platform text
    check (gaming_platform in ('PC','PlayStation','Xbox','Nintendo','Mobile','Steam Deck','Other'));
grant update(gaming_platform) on public.profiles to authenticated;
notify pgrst, 'reload schema';
commit;
