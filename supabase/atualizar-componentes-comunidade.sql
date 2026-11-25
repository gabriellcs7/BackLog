begin;
-- A featured list never changes list visibility or contents.
alter table public.profiles add column if not exists featured_list_id uuid references public.game_lists(id) on delete set null;
create or replace function public.set_featured_game_list(list_key uuid)
returns void language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=auth.uid();
begin
 if owner_id is null then raise exception 'Sign in first'; end if;
 if list_key is not null and not exists(select 1 from public.game_lists where id=list_key and user_id=owner_id) then raise exception 'List not found'; end if;
 update public.profiles set featured_list_id=list_key where id=owner_id;
 if not found then raise exception 'Profile not found'; end if;
end;
$$;
revoke all on function public.set_featured_game_list(uuid) from public,anon,authenticated;
grant execute on function public.set_featured_game_list(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
