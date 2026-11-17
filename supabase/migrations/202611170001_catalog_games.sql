begin;
insert into public.games(id) values
    ('cuphead'),
    ('cuphead-the-delicious-last-course'),
    ('marvel-rivals'),
    ('marvels-wolverine'),
    ('poppy-playtime'),
    ('poppy-playtime-chapter-2'),
    ('poppy-playtime-chapter-3'),
    ('poppy-playtime-chapter-4'),
    ('poppy-playtime-chapter-5'),
    ('project-playtime'),
    ('escape-from-playtime'),
    ('skate'),
    ('zelda-ocarina-of-time-switch-2'),
    ('minecraft-dungeons'),
    ('dark-souls'),
    ('dark-souls-ii'),
    ('dark-souls-iii')
on conflict (id) do nothing;
commit;
