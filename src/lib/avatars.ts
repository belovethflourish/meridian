import type { SupabaseClient } from "@supabase/supabase-js";

export async function signAvatarUrls<T extends { id: string; avatar_url: string | null }>(
  supabase: SupabaseClient,
  rows: T[],
) {
  return Promise.all(
    rows.map(async (row) => {
      if (!row.avatar_url) return { ...row, imageUrl: null as string | null };
      const { data, error } = await supabase.storage.from("profile-images").createSignedUrl(row.avatar_url, 60 * 60);
      return { ...row, imageUrl: error ? null : data.signedUrl };
    }),
  );
}
