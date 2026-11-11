begin;
insert into public.games(id) values
    ('uncharted-drakes-fortune'),
    ('uncharted-2-among-thieves'),
    ('uncharted-3-drakes-deception'),
    ('uncharted-4-a-thiefs-end'),
    ('uncharted-the-lost-legacy')
on conflict (id) do nothing;
commit;
