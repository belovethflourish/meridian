export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-primary">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export function SetupNotice() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Connect Supabase to continue</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Add <code className="rounded bg-secondary px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-secondary px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
        <code className="rounded bg-secondary px-1">.env.local</code>, then apply the migration in{" "}
        <code className="rounded bg-secondary px-1">supabase/migrations</code>.
      </p>
    </div>
  );
}
