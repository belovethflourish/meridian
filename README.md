# Meridian

Meridian is an attitude and aptitude assessment platform. Organizations publish tests, members take them under a timer, and scores are calculated in Postgres so answer keys never reach the browser until an attempt is submitted.

## Stack

- Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- Supabase Auth, Postgres, Storage, and Row Level Security

## Roles

| Role | After login | Can see |
| --- | --- | --- |
| Member | `/dashboard` | Members, published assessments, their own attempts |
| Admin | `/admin/dashboard` | Members and admins, assessments, questions, reports |
| Super admin | `/super-admin/dashboard` | Everyone, role changes, settings, analytics |

Profile images live in the private `profile-images` bucket at `{user_id}/avatar.ext`. Storage policies match the directory:

- A member can read member images, including their own.
- An admin can read member and admin images.
- A super admin can read every image.
- A user can upload, replace, and delete only the object in their own folder.

## Routes

Public: `/`, `/about`, `/pricing`, `/contact`

Auth: `/login`, `/register`, `/forgot-password`, `/reset-password`

Member: `/dashboard`, `/profile`, `/assessments`, `/results`, `/users`

Admin: `/admin/dashboard`, `/admin/users`, `/admin/assessments`, `/admin/questions`, `/admin/reports`

Super admin: `/super-admin/dashboard`, `/super-admin/users`, `/super-admin/settings`

Protected API: `GET /api/me`, `GET /api/admin/stats`

## Setup

1. Create a Supabase project.
2. In the SQL editor, run `supabase/migrations/20261001120000_init.sql`.
3. In Authentication → URL configuration, set the site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` as a redirect URL.
4. Copy `.env.example` to `.env.local` and fill in the project URL and anon key.
5. Install and run:

```bash
npm install
npm run dev
```

6. Register the first account, then promote it in the SQL editor:

```sql
update public.profiles
set role = 'super_admin'
where email = 'you@example.com';
```

That statement is allowed from the SQL editor because there is no end-user JWT. From the app, only a super admin can change roles, and the last super admin cannot demote themselves.

Email confirmation uses Supabase. The register screen waits for the confirmation link when confirmations are enabled. The callback route exchanges the code and sends the person to the dashboard for their role.

## What the database already includes

Beyond the required tables (`profiles`, `assessments`, `questions`, `attempts`, `answers`, `reports`), the migration adds the pieces a later release will need:

- `organizations`, `organization_members`, `plans`, `subscriptions`
- `assessment_assignments`
- `ai_generations` for a question generator and candidate-report worker
- `app_settings`
- `contact_messages`

Scoring, saving an answer, starting an attempt, and reading a finished review are `security definer` functions. Members cannot select `questions.correct_answer` while a test is open. Likert option scores are stripped from the payload used during the attempt.

A published catalog is seeded so a new member can take a test immediately. Categories cover numerical, logical, verbal, and abstract reasoning, plus personality, leadership, emotional intelligence, and work behaviour.

## AI

Admins can queue a job from an assessment or a report. The row is inserted into `ai_generations` with `status = pending`. No model is called. A worker you add later should claim pending rows, write `output`, and set `status` to `completed` or `failed`. The settings screen has switches that record whether each feature is ready. They do not send prompts anywhere.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
