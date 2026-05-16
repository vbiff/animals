insert into storage.buckets (id, name, public)
values ('pet-files', 'pet-files', false)
on conflict (id) do nothing;

create policy "pet_files_select" on storage.objects for select using (
  auth.uid() is not null and
  public.is_pet_owner((string_to_array(name, '/'))[1]::uuid)
);

create policy "pet_files_insert" on storage.objects for insert with check (
  auth.uid() is not null and
  public.is_pet_owner((string_to_array(name, '/'))[1]::uuid)
);

create policy "pet_files_delete" on storage.objects for delete using (
  auth.uid() is not null and
  public.is_pet_owner((string_to_array(name, '/'))[1]::uuid)
);
