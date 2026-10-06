import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { listDirectory } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { UsersDirectory } from "@/components/users/users-directory";

export const metadata: Metadata = { title: "People" };

export default async function UsersPage() {
  const { supabase, profile } = await requireUser();

  // Members cannot browse other profiles.
  if (profile.role === "member") {
    redirect("/profile");
  }

  let users;
  try {
    users = await listDirectory(supabase, true);
  } catch (error) {
    return <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Could not load people."}</p>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Directory"
        title="People"
        description={
          profile.role === "super_admin"
            ? "Super admins can view admin and member profiles."
            : "Admins can view member profiles only."
        }
      />
      <UsersDirectory users={users} canManageRoles={profile.role === "super_admin"} viewerId={profile.id} />
    </div>
  );
}
