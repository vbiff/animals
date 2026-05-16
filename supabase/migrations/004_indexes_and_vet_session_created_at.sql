-- Performance indexes on foreign keys
create index if not exists idx_pet_owners_user_id on public.pet_owners(user_id);
create index if not exists idx_pet_owners_pet_id on public.pet_owners(pet_id);
create index if not exists idx_vaccines_pet_id on public.vaccines(pet_id);
create index if not exists idx_symptoms_pet_id on public.symptoms(pet_id);
create index if not exists idx_medications_pet_id on public.medications(pet_id);
create index if not exists idx_documents_pet_id on public.documents(pet_id);
create index if not exists idx_vet_sessions_expires_at on public.vet_sessions(expires_at);

-- Track when vet session was created (audit trail)
alter table public.vet_sessions add column if not exists created_at timestamptz not null default now();
