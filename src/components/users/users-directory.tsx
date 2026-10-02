"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/constants";
import type { DirectoryUser } from "@/lib/types";
import { changeUserRole } from "@/server/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UsersDirectory({
  users,
  canManageRoles,
  viewerId,
}: {
  users: DirectoryUser[];
  canManageRoles: boolean;
  viewerId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) =>
      [user.full_name, user.email, ROLE_LABELS[user.role]].filter(Boolean).join(" ").toLowerCase().includes(needle),
    );
  }, [query, users]);

  async function onRole(userId: string, role: Role) {
    setPendingId(userId);
    const result = await changeUserRole({ userId, role });
    setPendingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Role updated");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name or role"
        className="max-w-sm"
      />
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              {users.some((user) => user.email) ? <TableHead>Email</TableHead> : null}
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No people match this view.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {user.imageUrl ? <AvatarImage src={user.imageUrl} alt="" /> : null}
                        <AvatarFallback>{initials(user.full_name) || "M"}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.full_name || "Unnamed"}</span>
                    </div>
                  </TableCell>
                  {users.some((person) => person.email) ? <TableCell>{user.email}</TableCell> : null}
                  <TableCell>
                    {canManageRoles && user.id !== viewerId ? (
                      <Select
                        value={user.role}
                        onValueChange={(value) => onRole(user.id, value as Role)}
                        disabled={pendingId === user.id}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={user.role === "member" ? "secondary" : "accent"}>{ROLE_LABELS[user.role]}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
                      new Date(user.created_at),
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
