import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { signAvatarUrls } from "@/lib/data";
import { ROLE_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { ProfileEditor } from "@/components/profile/profile-editor";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { supabase, profile } = await requireUser();
  const [signed] = await signAvatarUrls(supabase, [profile]);

  return (
    <div>
      <PageHeader
        eyebrow={ROLE_LABELS[profile.role]}
        title="Profile"
        description="Your name and image. Super admins can view admin and member profiles; admins can view member profiles only; members cannot browse other profiles."
      />
      <ProfileEditor
        userId={profile.id}
        fullName={profile.full_name}
        email={profile.email}
        imageUrl={signed?.imageUrl ?? null}
        avatarPath={profile.avatar_url}
      />
    </div>
  );
}
