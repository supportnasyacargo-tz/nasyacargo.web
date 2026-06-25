create extension if not exists pgcrypto;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  email text not null check (
    email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
  phone text check (phone is null or char_length(trim(phone)) <= 40),
  subject text check (subject is null or char_length(trim(subject)) <= 120),
  message text not null check (char_length(trim(message)) between 5 and 3000),
  source_page text,
  user_agent text,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

revoke all on table public.contact_messages from anon;
revoke all on table public.contact_messages from authenticated;

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists contact_messages_status_idx
  on public.contact_messages (status);
