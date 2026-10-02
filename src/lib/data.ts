import type { SupabaseClient } from "@supabase/supabase-js";
import type { DirectoryUser, Profile } from "@/lib/types";

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

export async function listDirectory(
  supabase: SupabaseClient,
  includeEmail: boolean,
): Promise<DirectoryUser[]> {
  const columns = includeEmail
    ? "id, full_name, email, avatar_url, role, created_at"
    : "id, full_name, avatar_url, role, created_at";

  const { data, error } = await supabase
    .from("profiles")
    .select(columns)
    .order("full_name", { ascending: true })
    .limit(200);

  if (error) throw new Error(error.message);
  const signed = await signAvatarUrls(supabase, (data ?? []) as unknown as Profile[]);
  return signed.map((person) => ({
    id: person.id,
    full_name: person.full_name,
    email: "email" in person ? person.email : undefined,
    avatar_url: person.avatar_url,
    role: person.role,
    created_at: person.created_at,
    imageUrl: person.imageUrl,
  }));
}

export async function countRows(
  supabase: SupabaseClient,
  table: "profiles" | "assessments" | "attempts" | "reports" | "questions",
  column?: string,
  value?: string,
) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (column && value) query = query.eq(column, value);
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}
