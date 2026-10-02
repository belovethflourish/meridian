import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { listDirectory } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { UsersDirectory } from "@/components/users/users-directory";

export const metadata: Metadata = { title: "All users" };

export default async function SuperAdminUsersPage() {
  const { supabase, profile } = await requireRole(["super_admin"]);
  const users = await listDirectory(supabase, true);
  return (
    <div>
      <PageHeader
        eyebrow="Access"
        title="All users"
        description="Promote a member to admin, or add another super admin. You cannot demote yourself here."
      />
      <UsersDirectory users={users} canManageRoles viewerId={profile.id} />
    </div>
  );
}
