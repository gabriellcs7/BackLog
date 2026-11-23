begin;
-- Etiquetas separadas da descrição, preservando listas existentes e suas políticas.
create or replace function public.valid_game_list_tags(value text[])
returns boolean language sql immutable strict set search_path='' as $$
    select cardinality(value)<=8
       and not exists(select 1 from unnest(value) tag where tag is null or length(tag)<1 or length(tag)>24 or tag<>btrim(tag) or tag ~ E'[\n\r\t]')
       and cardinality(value)=(select count(distinct lower(tag)) from unnest(value) tag);
$$;
revoke all on function public.valid_game_list_tags(text[]) from public,anon,authenticated;
grant execute on function public.valid_game_list_tags(text[]) to authenticated;
alter table public.game_lists add column if not exists tags text[] not null default '{}';
do $$ begin
    if not exists(select 1 from pg_constraint where conrelid='public.game_lists'::regclass and conname='game_lists_tags_valid') then
        alter table public.game_lists add constraint game_lists_tags_valid check(public.valid_game_list_tags(tags));
    end if;
end $$;
grant update(tags) on public.game_lists to authenticated;
create or replace function public.save_game_list_v3(list_id uuid,list_name text,list_description text,public_list boolean,ranked_list boolean,game_ids text[],list_tags text[])
returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid;
begin
    if auth.uid() is null then raise exception 'Sign in first'; end if;
    if list_tags is null or not public.valid_game_list_tags(list_tags) then raise exception 'Use up to 8 different tags of 1 to 24 characters'; end if;
    result:=public.save_game_list_v2(list_id,list_name,list_description,public_list,ranked_list,game_ids);
    update public.game_lists set tags=list_tags where id=result and user_id=auth.uid();
    return result;
end;
$$;
revoke all on function public.save_game_list_v3(uuid,text,text,boolean,boolean,text[],text[]) from public,anon,authenticated;
grant execute on function public.save_game_list_v3(uuid,text,text,boolean,boolean,text[],text[]) to authenticated;
notify pgrst,'reload schema';
commit;
