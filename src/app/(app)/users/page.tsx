import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { listDirectory } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { UsersDirectory } from "@/components/users/users-directory";

export const metadata: Metadata = { title: "People" };

export default async function UsersPage() {
  const { supabase, profile } = await requireUser();
  const includeEmail = profile.role !== "member";
  let users;
  try {
    users = await listDirectory(supabase, includeEmail);
  } catch (error) {
    return <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Could not load people."}</p>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Directory"
        title="People"
        description="You only see the roles your account is allowed to see. Profile images use the same rule."
      />
      <UsersDirectory users={users} canManageRoles={profile.role === "super_admin"} viewerId={profile.id} />
    </div>
  );
}
