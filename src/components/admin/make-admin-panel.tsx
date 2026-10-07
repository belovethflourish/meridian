"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { changeUserRole, makeAdminByEmail } from "@/server/users";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type MemberRow = {
  id: string;
  full_name: string;
  email: string;
};

export function MakeAdminPanel({ members }: { members: MemberRow[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function onEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await makeAdminByEmail({ email });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Admin added");
    setEmail("");
    router.refresh();
  }

  async function onMakeAdmin(userId: string) {
    setPendingId(userId);
    const result = await changeUserRole({ userId, role: "admin" });
    setPendingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Member promoted to admin");
    router.refresh();
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Add admin</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Enter the email of an existing account to make them an admin.
          </p>
          <form onSubmit={onEmailSubmit} className="space-y-4">
            <Field label="Email" hint="They must already have a Meridian account.">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                required
              />
            </Field>
            <Button disabled={pending || !email.trim()} type="submit">
              {pending ? "Adding..." : "Make admin"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Make admin from members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members available to promote yet.</p>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-2 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{member.full_name || "Unnamed"}</p>
                  <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pendingId === member.id}
                  onClick={() => void onMakeAdmin(member.id)}
                >
                  {pendingId === member.id ? "Updating..." : "Make admin"}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
