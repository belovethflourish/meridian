import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { listDirectory } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { UsersDirectory } from "@/components/users/users-directory";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const { supabase, profile } = await requireRole(["admin", "super_admin"]);
  const users = await listDirectory(supabase, true);
  return (
    <div>
      <PageHeader
        eyebrow="Directory"
        title="Users"
        description="Admins see members and other admins. Super admin accounts stay out of this list."
      />
      <UsersDirectory users={users} canManageRoles={profile.role === "super_admin"} viewerId={profile.id} />
    </div>
  );
}
