"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateAvatarPath, updateProfile } from "@/server/profile";
import { createClient } from "@/lib/supabase/client";
import { profileSchema } from "@/lib/validators";
import { Field } from "@/components/field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileEditor({
  userId,
  fullName,
  email,
  imageUrl,
  avatarPath,
}: {
  userId: string;
  fullName: string;
  email: string;
  imageUrl: string | null;
  avatarPath: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState(imageUrl);
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    const parsed = profileSchema.safeParse({ fullName: name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter your name.");
      return;
    }
    setPending(true);
    const result = await updateProfile(parsed.data.fullName);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    toast.success("Profile updated");
    router.refresh();
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Images must be 2 MB or smaller.");
      return;
    }
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/avatar.${extension}`;
    setPending(true);
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from("profile-images").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (uploadError) {
      setPending(false);
      setError(uploadError.message);
      return;
    }
    if (avatarPath && avatarPath !== path) {
      await supabase.storage.from("profile-images").remove([avatarPath]);
    }
    const result = await updateAvatarPath(path);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPreview(URL.createObjectURL(file));
    setError(null);
    toast.success("Profile image updated");
    router.refresh();
  }

  async function onDelete() {
    if (!avatarPath) return;
    setPending(true);
    const supabase = createClient();
    const { error: removeError } = await supabase.storage.from("profile-images").remove([avatarPath]);
    if (removeError) {
      setPending(false);
      setError(removeError.message);
      return;
    }
    const result = await updateAvatarPath(null);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPreview(null);
    toast.success("Profile image removed");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <div className="rounded-xl border bg-card p-5">
        <Avatar className="h-24 w-24">
          {preview ? <AvatarImage src={preview} alt="" /> : null}
          <AvatarFallback className="text-lg">{initials || "M"}</AvatarFallback>
        </Avatar>
        <div className="mt-4 space-y-2">
          <label className="block">
            <span className="sr-only">Upload profile image</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-xs file:font-medium"
              onChange={(event) => onFile(event.target.files?.[0])}
              disabled={pending}
            />
          </label>
          {avatarPath ? (
            <Button type="button" variant="outline" size="sm" onClick={onDelete} disabled={pending}>
              Delete image
            </Button>
          ) : null}
        </div>
      </div>
      <form onSubmit={onSave} className="space-y-4 rounded-xl border bg-card p-5">
        <Field label="Full name">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Email" hint="Email changes go through the verification flow on your account provider.">
          <Input value={email} disabled />
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button disabled={pending} type="submit">
          {pending ? "Saving..." : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
