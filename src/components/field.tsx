import { Label } from "@/components/ui/label";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
