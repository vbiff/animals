create or replace function public.create_pet(
  p_name text,
  p_species text,
  p_breed text,
  p_birth_date date,
  p_photo_url text default null
)
returns public.pets
language plpgsql
security definer
set search_path = public
as $$
declare
  new_pet public.pets;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  insert into public.pets (name, species, breed, birth_date, photo_url)
  values (p_name, p_species, coalesce(p_breed, ''), p_birth_date, p_photo_url)
  returning * into new_pet;

  insert into public.pet_owners (pet_id, user_id, invited_by)
  values (new_pet.id, auth.uid(), null);

  return new_pet;
end;
$$;

revoke all on function public.create_pet(text, text, text, date, text) from public;
grant execute on function public.create_pet(text, text, text, date, text) to authenticated;
