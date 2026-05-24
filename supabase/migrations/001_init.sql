-- Users profile (extends auth.users)
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now()
);

-- Rooms
create type room_status as enum ('lobby', 'playing', 'finished');
create type room_language as enum ('it', 'en');

create table public.rooms (
  id          uuid primary key default gen_random_uuid(),
  code        varchar(6) not null unique,
  host_id     uuid references public.users(id) on delete set null,
  adventure   int not null default 1 check (adventure between 1 and 7),
  status      room_status not null default 'lobby',
  language    room_language not null default 'it',
  game_state  jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index rooms_code_idx on public.rooms(code);
create index rooms_status_idx on public.rooms(status);

-- Room players
create table public.room_players (
  id               uuid primary key default gen_random_uuid(),
  room_id          uuid not null references public.rooms(id) on delete cascade,
  user_id          uuid not null references public.users(id) on delete cascade,
  hero             text check (hero in ('harry', 'ron', 'hermione', 'neville')),
  controlled_heroes text[] default '{}',
  turn_order       int not null default 0,
  joined_at        timestamptz default now(),
  unique(room_id, user_id)
);

-- Chat
create table public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.rooms(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  content    text not null check (char_length(content) <= 500),
  created_at timestamptz default now()
);

create index chat_room_idx on public.chat_messages(room_id, created_at);

-- Event log
create table public.event_log (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rooms(id) on delete cascade,
  turn        int not null default 1,
  event_type  varchar(50) not null,
  payload     jsonb default '{}',
  created_at  timestamptz default now()
);

create index event_log_room_idx on public.event_log(room_id, turn);

-- Cards catalog
create table public.cards (
  id               text primary key,
  type             text not null check (type in ('hogwarts', 'dark_arts', 'villain', 'location', 'hero')),
  adventure        int not null default 1,
  name_it          text not null,
  name_en          text not null,
  cost             int default 0,
  effects          jsonb default '[]',
  ability_text_it  text,
  ability_text_en  text,
  image_url        text
);

-- Auto-update updated_at on rooms
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger rooms_updated_at
  before update on public.rooms
  for each row execute function update_updated_at();

-- Auto-create user profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
