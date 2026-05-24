create table public.user_adventures (
  user_id      uuid not null references public.users(id) on delete cascade,
  adventure    int  not null check (adventure between 1 and 7),
  completed_at timestamptz default now(),
  primary key (user_id, adventure)
);

alter table public.user_adventures enable row level security;

create policy "user_adventures_own" on public.user_adventures
  for all using (auth.uid() = user_id);

-- Adventure 1 is always unlocked — insert for every existing user
insert into public.user_adventures (user_id, adventure)
select id, 1 from public.users
on conflict do nothing;

-- Trigger: auto-unlock adventure 1 for new users
create or replace function unlock_adventure_1()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_adventures (user_id, adventure) values (new.id, 1)
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_user_created_unlock_a1
  after insert on public.users
  for each row execute function unlock_adventure_1();
