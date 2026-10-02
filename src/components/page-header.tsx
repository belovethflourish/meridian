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
        {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">{eyebrow}</p> : null}
        <h1 className="mt-1 font-serif text-3xl tracking-tight md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
