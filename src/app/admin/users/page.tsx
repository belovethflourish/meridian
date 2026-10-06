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
        description={
          profile.role === "super_admin"
            ? "Super admins can view admin and member profiles, and change roles."
            : "Admins can view member profiles only."
        }
      />
      <UsersDirectory
        users={profile.role === "admin" ? users.filter((user) => user.role === "member") : users}
        canManageRoles={profile.role === "super_admin"}
        viewerId={profile.id}
      />
    </div>
  );
}
