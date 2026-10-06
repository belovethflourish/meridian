-- Profile visibility:
-- - everyone can see their own profile
-- - super_admin can see admins and members (and other super admins)
-- - admin can see members only
-- - members cannot browse other profiles
create or replace function public.can_view_profile(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles viewer
    join public.profiles target on target.id = target_id
    where viewer.id = auth.uid()
      and (
        target.id = viewer.id
        or viewer.role = 'super_admin'
        or (viewer.role = 'admin' and target.role = 'member')
      )
  )
$$;
