-- Create tables for Cramly

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS (handled by Supabase Auth usually, but we might want a profile table)
-- We'll assume usage of public.users or just auth.users references

-- DECKS
create table decks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CARDS
create table cards (
  id uuid default uuid_generate_v4() primary key,
  deck_id uuid references decks(id) on delete cascade not null,
  front text not null,
  back text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table decks enable row level security;
alter table cards enable row level security;

create policy "Users can view own decks" on decks
  for select using (auth.uid() = user_id);

create policy "Users can insert own decks" on decks
  for insert with check (auth.uid() = user_id);

create policy "Users can view own cards" on cards
  for select using (
    exists ( select 1 from decks where decks.id = cards.deck_id and decks.user_id = auth.uid() )
  );

create policy "Users can insert own cards" on cards
  for insert with check (
    exists ( select 1 from decks where decks.id = cards.deck_id and decks.user_id = auth.uid() )
  );
