create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  species text not null,
  breed text not null default '',
  birth_date date not null,
  photo_url text,
  created_at timestamptz not null default now()
);

create table public.pet_owners (
  pet_id uuid not null references public.pets(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  invited_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  primary key (pet_id, user_id)
);

create table public.vaccines (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  name text not null,
  date date not null,
  next_date date,
  document_url text,
  added_by jsonb not null,
  created_at timestamptz not null default now()
);

create table public.symptoms (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  date date not null,
  title text not null,
  description text not null default '',
  added_by jsonb not null,
  created_at timestamptz not null default now()
);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  name text not null,
  dosage text not null,
  frequency text not null,
  start_date date not null,
  end_date date,
  added_by jsonb not null,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  name text not null,
  file_url text not null,
  type text not null check (type in ('analysis', 'xray', 'prescription', 'other')),
  added_by jsonb not null,
  created_at timestamptz not null default now()
);

create table public.vet_sessions (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  expires_at timestamptz not null default (now() + interval '4 hours'),
  created_by uuid not null references public.users(id),
  vet_name text,
  vet_license text
);

create table public.invite_tokens (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  created_by uuid not null references public.users(id),
  accepted_by uuid references public.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

-- Sync auth.users → public.users on sign up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
