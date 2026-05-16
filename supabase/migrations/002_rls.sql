alter table public.users enable row level security;
alter table public.pets enable row level security;
alter table public.pet_owners enable row level security;
alter table public.vaccines enable row level security;
alter table public.symptoms enable row level security;
alter table public.medications enable row level security;
alter table public.documents enable row level security;
alter table public.vet_sessions enable row level security;
alter table public.invite_tokens enable row level security;

create or replace function public.is_pet_owner(p_pet_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.pet_owners
    where pet_id = p_pet_id and user_id = auth.uid()
  );
$$;

-- users
create policy "users_select_own" on public.users for select using (id = auth.uid());
create policy "users_update_own" on public.users for update using (id = auth.uid());

-- pets
create policy "pets_select" on public.pets for select using (public.is_pet_owner(id));
create policy "pets_insert" on public.pets for insert with check (auth.uid() is not null);
create policy "pets_update" on public.pets for update using (public.is_pet_owner(id));

-- pet_owners
create policy "pet_owners_select" on public.pet_owners for select using (user_id = auth.uid() or public.is_pet_owner(pet_id));
create policy "pet_owners_insert" on public.pet_owners for insert with check (auth.uid() is not null);

-- vaccines
create policy "vaccines_select" on public.vaccines for select using (public.is_pet_owner(pet_id));
create policy "vaccines_insert" on public.vaccines for insert with check (public.is_pet_owner(pet_id));
create policy "vaccines_delete" on public.vaccines for delete using (public.is_pet_owner(pet_id));

-- symptoms
create policy "symptoms_select" on public.symptoms for select using (public.is_pet_owner(pet_id));
create policy "symptoms_insert" on public.symptoms for insert with check (public.is_pet_owner(pet_id));
create policy "symptoms_delete" on public.symptoms for delete using (public.is_pet_owner(pet_id));

-- medications
create policy "medications_select" on public.medications for select using (public.is_pet_owner(pet_id));
create policy "medications_insert" on public.medications for insert with check (public.is_pet_owner(pet_id));
create policy "medications_delete" on public.medications for delete using (public.is_pet_owner(pet_id));

-- documents
create policy "documents_select" on public.documents for select using (public.is_pet_owner(pet_id));
create policy "documents_insert" on public.documents for insert with check (public.is_pet_owner(pet_id));
create policy "documents_delete" on public.documents for delete using (public.is_pet_owner(pet_id));

-- vet_sessions: owners can create and view
create policy "vet_sessions_select" on public.vet_sessions for select using (public.is_pet_owner(pet_id));
create policy "vet_sessions_insert" on public.vet_sessions for insert with check (public.is_pet_owner(pet_id));

-- invite_tokens: owners can create and view
create policy "invite_tokens_select" on public.invite_tokens for select using (public.is_pet_owner(pet_id) or created_by = auth.uid());
create policy "invite_tokens_insert" on public.invite_tokens for insert with check (public.is_pet_owner(pet_id));
