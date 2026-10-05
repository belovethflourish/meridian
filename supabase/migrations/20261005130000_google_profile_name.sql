-- Prefer Google's `name` metadata when `full_name` is absent.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select id into v_org from public.organizations where slug = 'meridian' limit 1;

  insert into public.profiles (id, full_name, email, role, organization_id)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, 'member'), '@', 1)
    ),
    coalesce(new.email, ''),
    'member',
    v_org
  );

  if v_org is not null then
    insert into public.organization_members (organization_id, user_id, org_role)
    values (v_org, new.id, 'member')
    on conflict do nothing;
  end if;

  return new;
end;
$$;
