begin;
-- Atualização segura para listas existentes: todas começam sem ranking.
alter table public.game_lists add column if not exists is_ranked boolean not null default false;
grant update(is_ranked) on public.game_lists to authenticated;
create or replace function public.save_game_list_v2(list_id uuid,list_name text,list_description text,public_list boolean,ranked_list boolean,game_ids text[])
returns uuid language plpgsql security invoker set search_path = '' as $$
declare result uuid;
begin
    if auth.uid() is null then raise exception 'Sign in first'; end if;
    if ranked_list is null or public_list is null then raise exception 'Choose a list type and visibility'; end if;
    if game_ids is null or cardinality(game_ids)>100 or exists(select 1 from unnest(game_ids) g where g is null) or cardinality(game_ids)<>(select count(distinct g) from unnest(game_ids) g) then raise exception 'Choose different games from the catalog'; end if;
    if list_id is null then
        insert into public.game_lists(user_id,name,description,is_public,is_ranked)
        values(auth.uid(),trim(list_name),list_description,public_list,ranked_list) returning id into result;
    else
        update public.game_lists set name=trim(list_name),description=list_description,is_public=public_list,is_ranked=ranked_list,updated_at=now()
        where id=list_id and user_id=auth.uid() returning id into result;
        if result is null then raise exception 'List not found'; end if;
    end if;
    delete from public.list_games where public.list_games.list_id=result;
    insert into public.list_games(list_id,game_id,position)
    select result,game_id,position from unnest(game_ids) with ordinality as t(game_id,position);
    return result;
end;
$$;
revoke all on function public.save_game_list_v2(uuid,text,text,boolean,boolean,text[]) from public,anon,authenticated;
grant execute on function public.save_game_list_v2(uuid,text,text,boolean,boolean,text[]) to authenticated;
notify pgrst,'reload schema';
commit;
