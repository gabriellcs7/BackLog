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

begin;
-- Private inbox: players submit through this RPC; no browser can read messages.
create table if not exists public.site_feedback (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 category text not null check(category in ('issue','image','suggestion','other')),
 message text not null check(length(btrim(message)) between 10 and 500),
 created_at timestamptz not null default now()
);
create index if not exists site_feedback_owner_date on public.site_feedback(user_id,created_at desc);
alter table public.site_feedback enable row level security;
revoke all on table public.site_feedback from public,anon,authenticated;
grant all on table public.site_feedback to service_role;
create or replace function public.submit_site_feedback(feedback_category text,feedback_message text)
returns uuid language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=auth.uid();result uuid;
begin
 if owner_id is null then raise exception 'Sign in first'; end if;
 if feedback_category is null or feedback_category not in ('issue','image','suggestion','other') then raise exception 'Choose a feedback category'; end if;
 if feedback_message is null or length(btrim(feedback_message)) not between 10 and 500 then raise exception 'Use 10 to 500 characters for your feedback'; end if;
 perform pg_advisory_xact_lock(hashtext('backlog-feedback:'||owner_id::text)::bigint);
 if (select count(*) from public.site_feedback where user_id=owner_id and created_at>now()-interval '1 hour')>=5 then raise exception 'Feedback limit reached. Please try again in an hour.'; end if;
 insert into public.site_feedback(user_id,category,message) values(owner_id,feedback_category,btrim(feedback_message)) returning id into result;
 return result;
end;
$$;
revoke all on function public.submit_site_feedback(text,text) from public,anon,authenticated;
grant execute on function public.submit_site_feedback(text,text) to authenticated;
notify pgrst,'reload schema';
commit;
