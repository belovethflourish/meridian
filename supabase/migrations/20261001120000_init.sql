-- Meridian: attitude and aptitude assessments
-- Roles: member, admin, super_admin
-- Avatar visibility:
--   member      -> members only
--   admin       -> members and admins
--   super_admin -> everyone

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Organizations, plans, and subscriptions (multi-tenant foundation)
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  price_cents integer not null default 0,
  interval text not null default 'month' check (interval in ('month', 'year')),
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled')),
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  avatar_url text,
  role text not null default 'member' check (role in ('member', 'admin', 'super_admin')),
  organization_id uuid references public.organizations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  org_role text not null default 'member' check (org_role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Assessments
-- ---------------------------------------------------------------------------

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null check (category in (
    'numerical_reasoning',
    'logical_reasoning',
    'verbal_reasoning',
    'abstract_reasoning',
    'personality',
    'leadership',
    'emotional_intelligence',
    'work_behaviour'
  )),
  duration integer not null default 20 check (duration > 0 and duration <= 240),
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid references public.profiles (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('multiple_choice', 'true_false', 'likert')),
  options jsonb not null default '[]'::jsonb,
  correct_answer text,
  points integer not null default 1 check (points > 0 and points <= 100),
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  category text not null check (category in (
    'numerical_reasoning',
    'logical_reasoning',
    'verbal_reasoning',
    'abstract_reasoning',
    'personality',
    'leadership',
    'emotional_intelligence',
    'work_behaviour'
  )),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.assessment_assignments (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  assigned_by uuid references public.profiles (id) on delete set null,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  unique (assessment_id, user_id)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  score numeric(8, 2) not null default 0,
  percentage numeric(5, 1) not null default 0,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'expired')),
  category_scores jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  selected_answer text,
  is_correct boolean,
  points_awarded numeric(8, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  attempt_id uuid not null unique references public.attempts (id) on delete cascade,
  summary text not null,
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  category_scores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Future AI workers read pending rows. The application only queues work.
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  feature text not null check (feature in ('question_generator', 'candidate_report')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  requested_by uuid references public.profiles (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,
  assessment_id uuid references public.assessments (id) on delete set null,
  attempt_id uuid references public.attempts (id) on delete set null,
  prompt text,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  model text,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text,
  message text not null,
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_organization_idx on public.profiles (organization_id);
create index assessments_category_idx on public.assessments (category);
create index assessments_status_idx on public.assessments (status);
create index questions_assessment_idx on public.questions (assessment_id, sort_order);
create index attempts_user_idx on public.attempts (user_id, started_at desc);
create index attempts_assessment_idx on public.attempts (assessment_id);
create index reports_user_idx on public.reports (user_id, created_at desc);
create index ai_generations_status_idx on public.ai_generations (status, created_at);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.viewer_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

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
        viewer.role = 'super_admin'
        or (viewer.role = 'admin' and target.role in ('member', 'admin'))
        or (viewer.role = 'member' and target.role = 'member')
      )
  )
$$;

create or replace function public.can_view_avatar(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_view_profile(target_id)
$$;

create or replace function public.category_label(p_key text)
returns text
language sql
immutable
as $$
  select case p_key
    when 'numerical_reasoning' then 'Numerical Reasoning'
    when 'logical_reasoning' then 'Logical Reasoning'
    when 'verbal_reasoning' then 'Verbal Reasoning'
    when 'abstract_reasoning' then 'Abstract Reasoning'
    when 'personality' then 'Personality'
    when 'leadership' then 'Leadership'
    when 'emotional_intelligence' then 'Emotional Intelligence'
    when 'work_behaviour' then 'Work Behaviour'
    else initcap(replace(coalesce(p_key, ''), '_', ' '))
  end
$$;

create or replace function public.registration_open()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select case
        when jsonb_typeof(value) = 'boolean' then (value)::text::boolean
        else true
      end
      from public.app_settings
      where key = 'allow_public_registration'
    ),
    true
  )
$$;

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
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, 'member'), '@', 1)),
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

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if auth.uid() is null then
    new.updated_at = now();
    return new;
  end if;

  v_role := public.viewer_role();

  if v_role is distinct from 'super_admin' then
    new.role = old.role;
    new.email = old.email;
    new.organization_id = old.organization_id;
    new.id = old.id;
    new.created_at = old.created_at;
  else
    if old.id = auth.uid()
      and old.role = 'super_admin'
      and new.role is distinct from 'super_admin'
      and (select count(*) from public.profiles where role = 'super_admin') <= 1
    then
      raise exception 'The last super admin cannot be demoted.';
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = coalesce(new.email, email),
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;

create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

create trigger assessments_touch
  before update on public.assessments
  for each row execute function public.touch_updated_at();

create trigger answers_touch
  before update on public.answers
  for each row execute function public.touch_updated_at();

create trigger settings_touch
  before update on public.app_settings
  for each row execute function public.touch_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

-- ---------------------------------------------------------------------------
-- Scoring. Answer keys never leave the database until an attempt is complete.
-- ---------------------------------------------------------------------------

create or replace function public.apply_scores(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assessment uuid;
  v_score numeric := 0;
  v_max numeric := 0;
  v_percentage numeric := 0;
  v_categories jsonb := '{}'::jsonb;
  v_strengths jsonb := '[]'::jsonb;
  v_weaknesses jsonb := '[]'::jsonb;
  v_summary text;
begin
  select assessment_id into v_assessment from public.attempts where id = p_attempt_id;
  if v_assessment is null then
    raise exception 'Attempt not found';
  end if;

  with graded as (
    select
      ans.id as answer_id,
      q.category,
      greatest(coalesce(q.points, 1), 1)::numeric as max_points,
      case
        when q.question_type = 'likert' then least(
          greatest(coalesce(q.points, 1), 1)::numeric,
          coalesce((
            select (opt ->> 'score')::numeric
            from jsonb_array_elements(coalesce(q.options, '[]'::jsonb)) opt
            where opt ->> 'id' = ans.selected_answer
            limit 1
          ), 0)
        )
        when ans.selected_answer is not null
          and q.correct_answer is not null
          and lower(btrim(ans.selected_answer)) = lower(btrim(q.correct_answer))
          then greatest(coalesce(q.points, 1), 1)::numeric
        else 0::numeric
      end as earned
    from public.questions q
    left join public.answers ans
      on ans.question_id = q.id
     and ans.attempt_id = p_attempt_id
    where q.assessment_id = v_assessment
  ),
  scored as (
    update public.answers ans
    set points_awarded = g.earned,
        is_correct = (g.earned >= g.max_points * 0.8)
    from graded g
    where ans.id = g.answer_id
    returning ans.id
  )
  select
    coalesce(sum(g.earned), 0),
    coalesce(sum(g.max_points), 0),
    coalesce((
      select jsonb_object_agg(
        s.category,
        jsonb_build_object(
          'earned', s.earned,
          'max', s.max_points,
          'percentage', case when s.max_points = 0 then 0 else round(s.earned / s.max_points * 100, 1) end
        )
      )
      from (
        select category, sum(earned) as earned, sum(max_points) as max_points
        from graded
        group by category
      ) s
    ), '{}'::jsonb)
  into v_score, v_max, v_categories
  from graded g;

  v_percentage := case when v_max = 0 then 0 else round((v_score / v_max) * 100, 1) end;

  select coalesce(jsonb_agg(public.category_label(e.key) order by e.key), '[]'::jsonb)
  into v_strengths
  from jsonb_each(v_categories) as e(key, value)
  where (e.value ->> 'percentage')::numeric >= 75;

  select coalesce(jsonb_agg(public.category_label(e.key) order by e.key), '[]'::jsonb)
  into v_weaknesses
  from jsonb_each(v_categories) as e(key, value)
  where (e.value ->> 'percentage')::numeric < 60;

  v_summary := case
    when v_percentage >= 85 then 'Excellent performance. This result shows consistent strength across the skills this assessment measures.'
    when v_percentage >= 70 then 'Solid performance. Core ability is in place, with specific categories that would benefit from deliberate practice.'
    when v_percentage >= 50 then 'Developing performance. The foundations are visible, and a focused plan will close the remaining gaps.'
    else 'This result highlights a clear development opportunity. Concentrated practice on the weaker categories will improve readiness.'
  end;

  return jsonb_build_object(
    'score', v_score,
    'max', v_max,
    'percentage', v_percentage,
    'category_scores', v_categories,
    'strengths', v_strengths,
    'weaknesses', v_weaknesses,
    'summary', v_summary
  );
end;
$$;

create or replace function public.start_attempt(p_assessment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt uuid;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select status into v_status from public.assessments where id = p_assessment_id;
  if v_status is null then
    raise exception 'Assessment not found';
  end if;

  if v_status <> 'published'
    and not exists (
      select 1 from public.assessment_assignments
      where assessment_id = p_assessment_id and user_id = auth.uid()
    )
    and coalesce(public.viewer_role(), '') not in ('admin', 'super_admin')
  then
    raise exception 'This assessment is not available.';
  end if;

  select id into v_attempt
  from public.attempts
  where user_id = auth.uid()
    and assessment_id = p_assessment_id
    and status = 'in_progress'
  limit 1;

  if v_attempt is not null then
    return v_attempt;
  end if;

  insert into public.attempts (user_id, assessment_id, status)
  values (auth.uid(), p_assessment_id, 'in_progress')
  returning id into v_attempt;

  return v_attempt;
end;
$$;

create or replace function public.save_answer(
  p_attempt_id uuid,
  p_question_id uuid,
  p_selected text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assessment uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_selected is null or length(btrim(p_selected)) = 0 or length(p_selected) > 40 then
    raise exception 'Choose a valid answer.';
  end if;

  select assessment_id into v_assessment
  from public.attempts
  where id = p_attempt_id
    and user_id = auth.uid()
    and status = 'in_progress';

  if v_assessment is null then
    raise exception 'This attempt can no longer be edited.';
  end if;

  if not exists (
    select 1
    from public.questions
    where id = p_question_id
      and assessment_id = v_assessment
      and exists (
        select 1
        from jsonb_array_elements(coalesce(options, '[]'::jsonb)) opt
        where opt ->> 'id' = p_selected
      )
  ) then
    raise exception 'That answer is not valid for this question.';
  end if;

  insert into public.answers (attempt_id, question_id, selected_answer)
  values (p_attempt_id, p_question_id, p_selected)
  on conflict (attempt_id, question_id)
  do update set selected_answer = excluded.selected_answer, updated_at = now();
end;
$$;

create or replace function public.submit_attempt(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_assessment uuid;
  v_status text;
  v_started timestamptz;
  v_duration integer;
  v_expired boolean := false;
  v_result jsonb;
  v_report_id uuid;
  v_final text;
begin
  select user_id, assessment_id, status, started_at
  into v_user, v_assessment, v_status, v_started
  from public.attempts
  where id = p_attempt_id
  for update;

  if v_user is null or v_user is distinct from auth.uid() then
    raise exception 'Attempt not found';
  end if;

  if v_status <> 'in_progress' then
    return jsonb_build_object('attempt_id', p_attempt_id, 'status', v_status, 'already_completed', true);
  end if;

  select duration into v_duration from public.assessments where id = v_assessment;
  v_expired := now() > v_started + make_interval(mins => coalesce(v_duration, 30)) + interval '30 seconds';
  v_result := public.apply_scores(p_attempt_id);
  v_final := case when v_expired then 'expired' else 'submitted' end;

  if v_expired then
    v_result := jsonb_set(
      v_result,
      '{summary}',
      to_jsonb(
        'The timer ended before a manual submission. Answers saved up to that point were scored. '
        || coalesce(v_result ->> 'summary', '')
      )
    );
  end if;

  update public.attempts
  set score = (v_result ->> 'score')::numeric,
      percentage = (v_result ->> 'percentage')::numeric,
      category_scores = v_result -> 'category_scores',
      status = v_final,
      completed_at = now()
  where id = p_attempt_id;

  insert into public.reports (
    user_id, assessment_id, attempt_id, summary, strengths, weaknesses, category_scores
  ) values (
    v_user,
    v_assessment,
    p_attempt_id,
    v_result ->> 'summary',
    v_result -> 'strengths',
    v_result -> 'weaknesses',
    v_result -> 'category_scores'
  )
  on conflict (attempt_id) do update
  set summary = excluded.summary,
      strengths = excluded.strengths,
      weaknesses = excluded.weaknesses,
      category_scores = excluded.category_scores,
      created_at = now()
  returning id into v_report_id;

  return v_result || jsonb_build_object(
    'attempt_id', p_attempt_id,
    'report_id', v_report_id,
    'status', v_final
  );
end;
$$;

create or replace function public.refresh_report(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_assessment uuid;
  v_status text;
  v_result jsonb;
  v_report_id uuid;
begin
  select user_id, assessment_id, status
  into v_user, v_assessment, v_status
  from public.attempts
  where id = p_attempt_id;

  if v_user is null then
    raise exception 'Attempt not found';
  end if;

  if v_user is distinct from auth.uid() and not public.can_view_profile(v_user) then
    raise exception 'Not allowed';
  end if;

  if coalesce(public.viewer_role(), '') not in ('admin', 'super_admin') and v_user is distinct from auth.uid() then
    raise exception 'Not allowed';
  end if;

  if v_status = 'in_progress' then
    raise exception 'Submit the assessment before generating a report.';
  end if;

  v_result := public.apply_scores(p_attempt_id);

  update public.attempts
  set score = (v_result ->> 'score')::numeric,
      percentage = (v_result ->> 'percentage')::numeric,
      category_scores = v_result -> 'category_scores'
  where id = p_attempt_id;

  insert into public.reports (
    user_id, assessment_id, attempt_id, summary, strengths, weaknesses, category_scores
  ) values (
    v_user,
    v_assessment,
    p_attempt_id,
    v_result ->> 'summary',
    v_result -> 'strengths',
    v_result -> 'weaknesses',
    v_result -> 'category_scores'
  )
  on conflict (attempt_id) do update
  set summary = excluded.summary,
      strengths = excluded.strengths,
      weaknesses = excluded.weaknesses,
      category_scores = excluded.category_scores,
      created_at = now()
  returning id into v_report_id;

  return v_result || jsonb_build_object('attempt_id', p_attempt_id, 'report_id', v_report_id, 'status', v_status);
end;
$$;

create or replace function public.get_attempt_questions(p_attempt_id uuid)
returns table (
  id uuid,
  question_text text,
  question_type text,
  options jsonb,
  points integer,
  difficulty text,
  category text,
  sort_order integer,
  selected_answer text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.attempts a
    where a.id = p_attempt_id and a.user_id = auth.uid()
  ) then
    raise exception 'Attempt not found';
  end if;

  return query
  select
    q.id,
    q.question_text,
    q.question_type,
    coalesce((
      select jsonb_agg(jsonb_build_object('id', opt ->> 'id', 'text', opt ->> 'text') order by ord)
      from jsonb_array_elements(coalesce(q.options, '[]'::jsonb)) with ordinality as t(opt, ord)
    ), '[]'::jsonb),
    q.points,
    q.difficulty,
    q.category,
    q.sort_order,
    ans.selected_answer
  from public.attempts a
  join public.questions q on q.assessment_id = a.assessment_id
  left join public.answers ans on ans.attempt_id = a.id and ans.question_id = q.id
  where a.id = p_attempt_id
  order by q.sort_order, q.created_at;
end;
$$;

create or replace function public.get_attempt_review(p_attempt_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row public.attempts%rowtype;
  v_result jsonb;
begin
  select * into v_row from public.attempts where id = p_attempt_id;
  if v_row.id is null then
    raise exception 'Attempt not found';
  end if;

  if v_row.user_id is distinct from auth.uid() and not (
    coalesce(public.viewer_role(), '') in ('admin', 'super_admin')
    and public.can_view_profile(v_row.user_id)
  ) then
    raise exception 'Not allowed';
  end if;

  if v_row.status = 'in_progress' then
    raise exception 'Results are available after submission.';
  end if;

  select jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', a.id,
      'score', a.score,
      'percentage', a.percentage,
      'status', a.status,
      'started_at', a.started_at,
      'completed_at', a.completed_at,
      'category_scores', a.category_scores,
      'user_id', a.user_id
    ),
    'assessment', jsonb_build_object(
      'id', s.id,
      'title', s.title,
      'description', s.description,
      'category', s.category,
      'difficulty', s.difficulty,
      'duration', s.duration
    ),
    'candidate', jsonb_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'email', p.email
    ),
    'report', (
      select jsonb_build_object(
        'id', r.id,
        'summary', r.summary,
        'strengths', r.strengths,
        'weaknesses', r.weaknesses,
        'created_at', r.created_at
      )
      from public.reports r
      where r.attempt_id = a.id
    ),
    'questions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', q.id,
          'question_text', q.question_text,
          'question_type', q.question_type,
          'options', q.options,
          'selected_answer', ans.selected_answer,
          'correct_answer', q.correct_answer,
          'is_correct', ans.is_correct,
          'points', q.points,
          'points_awarded', ans.points_awarded,
          'category', q.category
        )
        order by q.sort_order
      )
      from public.questions q
      left join public.answers ans on ans.question_id = q.id and ans.attempt_id = a.id
      where q.assessment_id = a.assessment_id
    ), '[]'::jsonb)
  )
  into v_result
  from public.attempts a
  join public.assessments s on s.id = a.assessment_id
  join public.profiles p on p.id = a.user_id
  where a.id = p_attempt_id;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.questions enable row level security;
alter table public.assessment_assignments enable row level security;
alter table public.attempts enable row level security;
alter table public.answers enable row level security;
alter table public.reports enable row level security;
alter table public.ai_generations enable row level security;
alter table public.app_settings enable row level security;
alter table public.contact_messages enable row level security;

create policy organizations_select on public.organizations
  for select to authenticated
  using (true);

create policy organizations_write on public.organizations
  for all to authenticated
  using (public.viewer_role() = 'super_admin')
  with check (public.viewer_role() = 'super_admin');

create policy plans_select on public.plans
  for select to anon, authenticated
  using (is_active = true or public.viewer_role() = 'super_admin');

create policy plans_write on public.plans
  for all to authenticated
  using (public.viewer_role() = 'super_admin')
  with check (public.viewer_role() = 'super_admin');

create policy subscriptions_admin on public.subscriptions
  for all to authenticated
  using (public.viewer_role() = 'super_admin')
  with check (public.viewer_role() = 'super_admin');

create policy org_members_select on public.organization_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.viewer_role() in ('admin', 'super_admin')
  );

create policy org_members_write on public.organization_members
  for all to authenticated
  using (public.viewer_role() = 'super_admin')
  with check (public.viewer_role() = 'super_admin');

create policy profiles_select on public.profiles
  for select to authenticated
  using (public.can_view_profile(id));

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.viewer_role() = 'super_admin')
  with check (id = auth.uid() or public.viewer_role() = 'super_admin');

create policy assessments_select on public.assessments
  for select to authenticated
  using (
    public.viewer_role() in ('admin', 'super_admin')
    or status = 'published'
    or exists (
      select 1 from public.assessment_assignments aa
      where aa.assessment_id = assessments.id and aa.user_id = auth.uid()
    )
  );

create policy assessments_write on public.assessments
  for all to authenticated
  using (public.viewer_role() in ('admin', 'super_admin'))
  with check (public.viewer_role() in ('admin', 'super_admin'));

create policy questions_admin on public.questions
  for all to authenticated
  using (public.viewer_role() in ('admin', 'super_admin'))
  with check (public.viewer_role() in ('admin', 'super_admin'));

create policy assignments_select on public.assessment_assignments
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.viewer_role() in ('admin', 'super_admin')
  );

create policy assignments_write on public.assessment_assignments
  for all to authenticated
  using (public.viewer_role() in ('admin', 'super_admin'))
  with check (
    public.viewer_role() in ('admin', 'super_admin')
    and exists (
      select 1 from public.profiles p
      where p.id = user_id and p.role = 'member'
    )
  );

create policy attempts_select on public.attempts
  for select to authenticated
  using (
    user_id = auth.uid()
    or (
      public.viewer_role() in ('admin', 'super_admin')
      and public.can_view_profile(user_id)
    )
  );

create policy answers_select on public.answers
  for select to authenticated
  using (
    exists (
      select 1 from public.attempts a
      where a.id = answers.attempt_id
        and (
          a.user_id = auth.uid()
          or (
            public.viewer_role() in ('admin', 'super_admin')
            and public.can_view_profile(a.user_id)
          )
        )
    )
  );

create policy reports_select on public.reports
  for select to authenticated
  using (
    user_id = auth.uid()
    or (
      public.viewer_role() in ('admin', 'super_admin')
      and public.can_view_profile(user_id)
    )
  );

create policy ai_select on public.ai_generations
  for select to authenticated
  using (
    requested_by = auth.uid()
    or public.viewer_role() in ('admin', 'super_admin')
  );

create policy ai_write on public.ai_generations
  for insert to authenticated
  with check (public.viewer_role() in ('admin', 'super_admin') and requested_by = auth.uid());

create policy settings_select on public.app_settings
  for select to authenticated
  using (true);

create policy settings_write on public.app_settings
  for all to authenticated
  using (public.viewer_role() = 'super_admin')
  with check (public.viewer_role() = 'super_admin');

create policy contact_insert on public.contact_messages
  for insert to anon, authenticated
  with check (char_length(name) >= 2 and char_length(message) >= 10 and email like '%@%');

create policy contact_select on public.contact_messages
  for select to authenticated
  using (public.viewer_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- Storage: private profile-images bucket
-- Path convention: {user_id}/avatar.ext
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy profile_images_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'profile-images'
    and public.can_view_avatar(
      case
        when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then ((storage.foldername(name))[1])::uuid
        else null
      end
    )
  );

create policy profile_images_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy profile_images_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy profile_images_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.plans to anon;
grant insert on public.contact_messages to anon;
grant usage, select on all sequences in schema public to authenticated, anon;

revoke all on function public.apply_scores(uuid) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.protect_profile_fields() from public, anon, authenticated;
revoke all on function public.sync_profile_email() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;

grant execute on function public.start_attempt(uuid) to authenticated;
grant execute on function public.save_answer(uuid, uuid, text) to authenticated;
grant execute on function public.submit_attempt(uuid) to authenticated;
grant execute on function public.refresh_report(uuid) to authenticated;
grant execute on function public.get_attempt_questions(uuid) to authenticated;
grant execute on function public.get_attempt_review(uuid) to authenticated;
grant execute on function public.registration_open() to anon, authenticated;
grant execute on function public.viewer_role() to anon, authenticated;
grant execute on function public.can_view_avatar(uuid) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;
grant execute on function public.category_label(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Seed: organization, plans, settings, catalog
-- ---------------------------------------------------------------------------

insert into public.organizations (id, name, slug)
values ('c1000000-0000-4000-8000-000000000001', 'Meridian', 'meridian');

insert into public.plans (code, name, description, price_cents, interval, features)
values
  ('starter', 'Starter', 'For teams piloting structured hiring and development.', 4900, 'month',
    '["Up to 25 members","Aptitude and attitude catalogs","Score reports","Email support"]'::jsonb),
  ('growth', 'Growth', 'For organizations running assessments across departments.', 14900, 'month',
    '["Up to 250 members","Custom assessments","Assignments and deadlines","Admin analytics","Priority support"]'::jsonb),
  ('enterprise', 'Enterprise', 'For multi-team programs that need control and a path to AI.', 0, 'year',
    '["Unlimited members","Super admin controls","SSO-ready architecture","AI generation pipeline","Dedicated success partner"]'::jsonb);

insert into public.subscriptions (organization_id, plan_id, status, current_period_end)
select 'c1000000-0000-4000-8000-000000000001', id, 'trialing', now() + interval '30 days'
from public.plans where code = 'growth';

insert into public.app_settings (key, value, description) values
  ('platform_name', '"Meridian"'::jsonb, 'Product name shown across the workspace.'),
  ('support_email', '"support@meridian.test"'::jsonb, 'Address used for support requests.'),
  ('allow_public_registration', 'true'::jsonb, 'When false, the register page stops accepting new members.'),
  ('default_duration_minutes', '20'::jsonb, 'Suggested duration for new assessments.'),
  ('ai_question_generator_enabled', 'false'::jsonb, 'Queues AI question jobs when a provider is connected.'),
  ('ai_candidate_reports_enabled', 'false'::jsonb, 'Queues AI narrative jobs when a provider is connected.');

insert into public.assessments (id, title, description, category, duration, difficulty, status, organization_id)
values
  ('a1000000-0000-4000-8000-000000000001', 'Numerical Reasoning',
    'Work with percentages, rates, and quantities. There is one best answer for each question.',
    'numerical_reasoning', 12, 'medium', 'published', 'c1000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000002', 'Logical Reasoning',
    'Test how you draw conclusions from structured information.',
    'logical_reasoning', 12, 'medium', 'published', 'c1000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000003', 'Verbal Reasoning',
    'Choose the precise word or the conclusion the passage actually supports.',
    'verbal_reasoning', 10, 'medium', 'published', 'c1000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000004', 'Abstract Reasoning',
    'Identify the rule that governs a short series.',
    'abstract_reasoning', 10, 'hard', 'published', 'c1000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000005', 'Leadership Style',
    'Rate how you typically lead. Higher agreement indicates a stronger expressed behavior.',
    'leadership', 8, 'easy', 'published', 'c1000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000006', 'Emotional Intelligence',
    'Reflect on how you notice and work with emotion, in yourself and in others.',
    'emotional_intelligence', 8, 'easy', 'published', 'c1000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000007', 'Work Behaviour',
    'A short inventory of reliability, ownership, and how you work with other people.',
    'work_behaviour', 8, 'easy', 'published', 'c1000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000008', 'Workplace Readiness',
    'A mixed profile across numerical, logical, leadership, and emotional intelligence items.',
    'work_behaviour', 15, 'medium', 'published', 'c1000000-0000-4000-8000-000000000001');

insert into public.questions (assessment_id, question_text, question_type, options, correct_answer, points, difficulty, category, sort_order)
values
  ('a1000000-0000-4000-8000-000000000001',
    'A jacket is discounted by 20% and now costs $80. What was the original price?',
    'multiple_choice',
    '[{"id":"a","text":"$96"},{"id":"b","text":"$100"},{"id":"c","text":"$120"},{"id":"d","text":"$64"}]'::jsonb,
    'b', 1, 'easy', 'numerical_reasoning', 1),
  ('a1000000-0000-4000-8000-000000000001',
    'The ratio of completed tasks to remaining tasks is 3:5. If 64 tasks exist in total, how many are complete?',
    'multiple_choice',
    '[{"id":"a","text":"24"},{"id":"b","text":"30"},{"id":"c","text":"40"},{"id":"d","text":"36"}]'::jsonb,
    'a', 1, 'medium', 'numerical_reasoning', 2),
  ('a1000000-0000-4000-8000-000000000001',
    'Five machines produce five units in five minutes. How many minutes will 100 machines need to produce 100 units?',
    'multiple_choice',
    '[{"id":"a","text":"100"},{"id":"b","text":"20"},{"id":"c","text":"5"},{"id":"d","text":"1"}]'::jsonb,
    'c', 1, 'medium', 'numerical_reasoning', 3),
  ('a1000000-0000-4000-8000-000000000001',
    'A project budget of $12,000 is split so design receives 25% more than research. Research receives how much?',
    'multiple_choice',
    '[{"id":"a","text":"$5,333"},{"id":"b","text":"$6,000"},{"id":"c","text":"$4,800"},{"id":"d","text":"$7,200"}]'::jsonb,
    'a', 1, 'hard', 'numerical_reasoning', 4),
  ('a1000000-0000-4000-8000-000000000002',
    'All analysts in the cohort completed training. Some people who completed training joined the client team. Which statement must be true?',
    'multiple_choice',
    '[{"id":"a","text":"All analysts joined the client team."},{"id":"b","text":"Some analysts may not have joined the client team."},{"id":"c","text":"Nobody on the client team is an analyst."},{"id":"d","text":"Everyone who joined the client team is an analyst."}]'::jsonb,
    'b', 1, 'medium', 'logical_reasoning', 1),
  ('a1000000-0000-4000-8000-000000000002',
    'What comes next in the sequence 2, 6, 12, 20, 30?',
    'multiple_choice',
    '[{"id":"a","text":"36"},{"id":"b","text":"40"},{"id":"c","text":"42"},{"id":"d","text":"48"}]'::jsonb,
    'c', 1, 'easy', 'logical_reasoning', 2),
  ('a1000000-0000-4000-8000-000000000002',
    'If no mentors are late, and Ada is late, what follows?',
    'multiple_choice',
    '[{"id":"a","text":"Ada is a mentor."},{"id":"b","text":"Ada is not a mentor."},{"id":"c","text":"Every late person is a mentor."},{"id":"d","text":"Mentors are sometimes late."}]'::jsonb,
    'b', 1, 'easy', 'logical_reasoning', 3),
  ('a1000000-0000-4000-8000-000000000002',
    'Which number does not belong with the others: 4, 9, 16, 25, 35, 49?',
    'multiple_choice',
    '[{"id":"a","text":"16"},{"id":"b","text":"25"},{"id":"c","text":"35"},{"id":"d","text":"49"}]'::jsonb,
    'c', 1, 'medium', 'logical_reasoning', 4),
  ('a1000000-0000-4000-8000-000000000003',
    'Choose the word most nearly opposite in meaning to ephemeral.',
    'multiple_choice',
    '[{"id":"a","text":"Fleeting"},{"id":"b","text":"Permanent"},{"id":"c","text":"Delicate"},{"id":"d","text":"Hidden"}]'::jsonb,
    'b', 1, 'easy', 'verbal_reasoning', 1),
  ('a1000000-0000-4000-8000-000000000003',
    'The memo says the pilot reduced complaints, but it does not say why. Which conclusion is justified?',
    'multiple_choice',
    '[{"id":"a","text":"The new script caused the reduction."},{"id":"b","text":"Complaints were lower during the pilot."},{"id":"c","text":"The team is now fully trained."},{"id":"d","text":"Customers prefer the new hours."}]'::jsonb,
    'b', 1, 'medium', 'verbal_reasoning', 2),
  ('a1000000-0000-4000-8000-000000000003',
    'Which sentence is the most precise?',
    'multiple_choice',
    '[{"id":"a","text":"The report was very unique and quite finished."},{"id":"b","text":"The report was finished on Tuesday and sent to finance."},{"id":"c","text":"The report was finished and stuff was sent."},{"id":"d","text":"The report was absolutely finalized in a timely manner."}]'::jsonb,
    'b', 1, 'easy', 'verbal_reasoning', 3),
  ('a1000000-0000-4000-8000-000000000004',
    'A series of shapes adds one side each step: triangle, square, pentagon, hexagon. What comes next?',
    'multiple_choice',
    '[{"id":"a","text":"Circle"},{"id":"b","text":"Heptagon"},{"id":"c","text":"Octagon"},{"id":"d","text":"Rectangle"}]'::jsonb,
    'b', 1, 'easy', 'abstract_reasoning', 1),
  ('a1000000-0000-4000-8000-000000000004',
    'Each step rotates a marker one position clockwise and adds a dot. After three steps the marker is at the bottom and there are three dots. Where is the marker after five steps, and how many dots are there?',
    'multiple_choice',
    '[{"id":"a","text":"Top, five dots"},{"id":"b","text":"Left, five dots"},{"id":"c","text":"Right, four dots"},{"id":"d","text":"Bottom, five dots"}]'::jsonb,
    'a', 1, 'hard', 'abstract_reasoning', 2),
  ('a1000000-0000-4000-8000-000000000004',
    'Two groups alternate: AB, ABB, ABBB. What is the next group?',
    'multiple_choice',
    '[{"id":"a","text":"ABBBB"},{"id":"b","text":"AAABB"},{"id":"c","text":"ABAB"},{"id":"d","text":"BBBBA"}]'::jsonb,
    'a', 1, 'medium', 'abstract_reasoning', 3),
  ('a1000000-0000-4000-8000-000000000005',
    'I explain the outcome I expect before I ask people to commit.',
    'likert',
    '[{"id":"1","text":"Strongly disagree","score":1},{"id":"2","text":"Disagree","score":2},{"id":"3","text":"Neutral","score":3},{"id":"4","text":"Agree","score":4},{"id":"5","text":"Strongly agree","score":5}]'::jsonb,
    null, 5, 'easy', 'leadership', 1),
  ('a1000000-0000-4000-8000-000000000005',
    'I ask for disagreement before I make a final decision.',
    'likert',
    '[{"id":"1","text":"Strongly disagree","score":1},{"id":"2","text":"Disagree","score":2},{"id":"3","text":"Neutral","score":3},{"id":"4","text":"Agree","score":4},{"id":"5","text":"Strongly agree","score":5}]'::jsonb,
    null, 5, 'easy', 'leadership', 2),
  ('a1000000-0000-4000-8000-000000000005',
    'When a plan slips, I name the owner and the next checkpoint.',
    'likert',
    '[{"id":"1","text":"Strongly disagree","score":1},{"id":"2","text":"Disagree","score":2},{"id":"3","text":"Neutral","score":3},{"id":"4","text":"Agree","score":4},{"id":"5","text":"Strongly agree","score":5}]'::jsonb,
    null, 5, 'easy', 'leadership', 3),
  ('a1000000-0000-4000-8000-000000000005',
    'I give credit in public and feedback in private.',
    'likert',
    '[{"id":"1","text":"Strongly disagree","score":1},{"id":"2","text":"Disagree","score":2},{"id":"3","text":"Neutral","score":3},{"id":"4","text":"Agree","score":4},{"id":"5","text":"Strongly agree","score":5}]'::jsonb,
    null, 5, 'easy', 'leadership', 4),
  ('a1000000-0000-4000-8000-000000000006',
    'I can name what I am feeling before I respond in a tense meeting.',
    'likert',
    '[{"id":"1","text":"Strongly disagree","score":1},{"id":"2","text":"Disagree","score":2},{"id":"3","text":"Neutral","score":3},{"id":"4","text":"Agree","score":4},{"id":"5","text":"Strongly agree","score":5}]'::jsonb,
    null, 5, 'easy', 'emotional_intelligence', 1),
  ('a1000000-0000-4000-8000-000000000006',
    'I notice when a colleague is withdrawn, even if they say they are fine.',
    'likert',
    '[{"id":"1","text":"Strongly disagree","score":1},{"id":"2","text":"Disagree","score":2},{"id":"3","text":"Neutral","score":3},{"id":"4","text":"Agree","score":4},{"id":"5","text":"Strongly agree","score":5}]'::jsonb,
    null, 5, 'easy', 'emotional_intelligence', 2),
  ('a1000000-0000-4000-8000-000000000006',
    'I can pause a sharp reply long enough to choose a useful one.',
    'likert',
    '[{"id":"1","text":"Strongly disagree","score":1},{"id":"2","text":"Disagree","score":2},{"id":"3","text":"Neutral","score":3},{"id":"4","text":"Agree","score":4},{"id":"5","text":"Strongly agree","score":5}]'::jsonb,
    null, 5, 'easy', 'emotional_intelligence', 3),
  ('a1000000-0000-4000-8000-000000000006',
    'I adapt my explanation when I see that someone is confused.',
    'likert',
    '[{"id":"1","text":"Strongly disagree","score":1},{"id":"2","text":"Disagree","score":2},{"id":"3","text":"Neutral","score":3},{"id":"4","text":"Agree","score":4},{"id":"5","text":"Strongly agree","score":5}]'::jsonb,
    null, 5, 'easy', 'emotional_intelligence', 4),
  ('a1000000-0000-4000-8000-000000000007',
    'I close the loop on commitments without being reminded.',
    'likert',
    '[{"id":"1","text":"Strongly disagree","score":1},{"id":"2","text":"Disagree","score":2},{"id":"3","text":"Neutral","score":3},{"id":"4","text":"Agree","score":4},{"id":"5","text":"Strongly agree","score":5}]'::jsonb,
    null, 5, 'easy', 'work_behaviour', 1),
  ('a1000000-0000-4000-8000-000000000007',
    'I raise a risk early, even when it is inconvenient.',
    'likert',
    '[{"id":"1","text":"Strongly disagree","score":1},{"id":"2","text":"Disagree","score":2},{"id":"3","text":"Neutral","score":3},{"id":"4","text":"Agree","score":4},{"id":"5","text":"Strongly agree","score":5}]'::jsonb,
    null, 5, 'easy', 'work_behaviour', 2),
  ('a1000000-0000-4000-8000-000000000007',
    'I share information my teammates need before they have to ask.',
    'likert',
    '[{"id":"1","text":"Strongly disagree","score":1},{"id":"2","text":"Disagree","score":2},{"id":"3","text":"Neutral","score":3},{"id":"4","text":"Agree","score":4},{"id":"5","text":"Strongly agree","score":5}]'::jsonb,
    null, 5, 'easy', 'work_behaviour', 3),
  ('a1000000-0000-4000-8000-000000000008',
    'A team completes 18 of 24 reviews. What percentage is complete?',
    'multiple_choice',
    '[{"id":"a","text":"65%"},{"id":"b","text":"70%"},{"id":"c","text":"75%"},{"id":"d","text":"80%"}]'::jsonb,
    'c', 1, 'easy', 'numerical_reasoning', 1),
  ('a1000000-0000-4000-8000-000000000008',
    'Every scheduled interview was confirmed. This interview was not confirmed. What follows?',
    'multiple_choice',
    '[{"id":"a","text":"This interview was not scheduled."},{"id":"b","text":"This interview was scheduled."},{"id":"c","text":"Confirmations are optional."},{"id":"d","text":"Nothing follows."}]'::jsonb,
    'a', 1, 'medium', 'logical_reasoning', 2),
  ('a1000000-0000-4000-8000-000000000008',
    'I make the decision criteria visible to the people affected by them.',
    'likert',
    '[{"id":"1","text":"Strongly disagree","score":1},{"id":"2","text":"Disagree","score":2},{"id":"3","text":"Neutral","score":3},{"id":"4","text":"Agree","score":4},{"id":"5","text":"Strongly agree","score":5}]'::jsonb,
    null, 5, 'easy', 'leadership', 3),
  ('a1000000-0000-4000-8000-000000000008',
    'I can stay constructive when I receive blunt feedback.',
    'likert',
    '[{"id":"1","text":"Strongly disagree","score":1},{"id":"2","text":"Disagree","score":2},{"id":"3","text":"Neutral","score":3},{"id":"4","text":"Agree","score":4},{"id":"5","text":"Strongly agree","score":5}]'::jsonb,
    null, 5, 'easy', 'emotional_intelligence', 4);

insert into public.assessments (id, title, description, category, duration, difficulty, status, organization_id)
values (
  'a1000000-0000-4000-8000-000000000009',
  'Personality Snapshot',
  'A brief look at how you prefer to work with structure, people, and pace.',
  'personality', 6, 'easy', 'published', 'c1000000-0000-4000-8000-000000000001'
);

insert into public.questions (assessment_id, question_text, question_type, options, correct_answer, points, difficulty, category, sort_order)
values
  ('a1000000-0000-4000-8000-000000000009',
    'I do my best work when the next step is written down.',
    'likert',
    '[{"id":"1","text":"Strongly disagree","score":1},{"id":"2","text":"Disagree","score":2},{"id":"3","text":"Neutral","score":3},{"id":"4","text":"Agree","score":4},{"id":"5","text":"Strongly agree","score":5}]'::jsonb,
    null, 5, 'easy', 'personality', 1),
  ('a1000000-0000-4000-8000-000000000009',
    'I gain energy from talking a problem through with other people.',
    'likert',
    '[{"id":"1","text":"Strongly disagree","score":1},{"id":"2","text":"Disagree","score":2},{"id":"3","text":"Neutral","score":3},{"id":"4","text":"Agree","score":4},{"id":"5","text":"Strongly agree","score":5}]'::jsonb,
    null, 5, 'easy', 'personality', 2),
  ('a1000000-0000-4000-8000-000000000009',
    'I would rather decide with partial information than wait for a perfect brief.',
    'likert',
    '[{"id":"1","text":"Strongly disagree","score":1},{"id":"2","text":"Disagree","score":2},{"id":"3","text":"Neutral","score":3},{"id":"4","text":"Agree","score":4},{"id":"5","text":"Strongly agree","score":5}]'::jsonb,
    null, 5, 'easy', 'personality', 3);
