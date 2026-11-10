begin;
insert into public.games(id) values ('hollow-knight'),('hollow-knight-silksong') on conflict do nothing;
commit;
