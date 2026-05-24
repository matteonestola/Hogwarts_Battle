-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.chat_messages enable row level security;
alter table public.event_log enable row level security;
alter table public.cards enable row level security;

-- Users: read own profile, service role can write
create policy "users_read_own" on public.users
  for select using (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- Rooms: anyone authenticated can read, create; only host can update
create policy "rooms_select" on public.rooms
  for select using (auth.role() = 'authenticated');

create policy "rooms_insert" on public.rooms
  for insert with check (auth.uid() = host_id);

create policy "rooms_update_service" on public.rooms
  for update using (true);  -- backend uses service role

-- Room players
create policy "room_players_select" on public.room_players
  for select using (auth.role() = 'authenticated');

create policy "room_players_insert" on public.room_players
  for insert with check (auth.uid() = user_id);

create policy "room_players_update_own" on public.room_players
  for update using (auth.uid() = user_id);

-- Chat messages: visible to room members
create policy "chat_select" on public.chat_messages
  for select using (
    exists (
      select 1 from public.room_players rp
      where rp.room_id = chat_messages.room_id
      and rp.user_id = auth.uid()
    )
  );

create policy "chat_insert" on public.chat_messages
  for insert with check (auth.uid() = user_id);

-- Event log: visible to room members
create policy "event_log_select" on public.event_log
  for select using (
    exists (
      select 1 from public.room_players rp
      where rp.room_id = event_log.room_id
      and rp.user_id = auth.uid()
    )
  );

-- Cards: public read
create policy "cards_public_read" on public.cards
  for select using (true);

-- Enable Realtime on key tables
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.event_log;
