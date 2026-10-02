import { requireRole, requireUser } from "@/lib/auth";
import { signAvatarUrls } from "@/lib/data";
import type { Role } from "@/lib/constants";
import { AppShell } from "@/components/layout/app-shell";

export async function AuthenticatedLayout({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const context = roles ? await requireRole(roles) : await requireUser();
  const [signed] = await signAvatarUrls(context.supabase, [context.profile]);

  return (
    <AppShell
      role={context.profile.role}
      name={context.profile.full_name || "Member"}
      email={context.profile.email}
      imageUrl={signed?.imageUrl ?? null}
    >
      {children}
    </AppShell>
  );
}
