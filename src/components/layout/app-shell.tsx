"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { logout } from "@/server/auth";
import { dashboardPath, ROLE_LABELS, type Role } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const icons = {
  dashboard: LayoutDashboard,
  assessments: ClipboardList,
  results: BarChart3,
  users: Users,
  profile: UserRound,
  settings: Settings,
};

type Item = { href: string; label: string; icon: keyof typeof icons };

function itemsFor(role: Role): Item[] {
  if (role === "super_admin") {
    return [
      { href: "/super-admin/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/super-admin/users", label: "Users", icon: "users" },
      { href: "/admin/assessments", label: "Assessments", icon: "assessments" },
      { href: "/admin/reports", label: "Reports", icon: "results" },
      { href: "/super-admin/settings", label: "Settings", icon: "settings" },
      { href: "/profile", label: "Profile", icon: "profile" },
    ];
  }
  if (role === "admin") {
    return [
      { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/admin/users", label: "Users", icon: "users" },
      { href: "/admin/assessments", label: "Assessments", icon: "assessments" },
      { href: "/admin/questions", label: "Questions", icon: "assessments" },
      { href: "/admin/reports", label: "Reports", icon: "results" },
      { href: "/profile", label: "Profile", icon: "profile" },
    ];
  }
  return [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/assessments", label: "Assessments", icon: "assessments" },
    { href: "/results", label: "Results", icon: "results" },
    { href: "/users", label: "People", icon: "users" },
    { href: "/profile", label: "Profile", icon: "profile" },
  ];
}

function NavLinks({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {itemsFor(role).map((item) => {
        const Icon = icons[item.icon];
        const active = pathname === item.href || (item.href !== dashboardPath(role) && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-300 hover:bg-white/5 hover:text-white",
              active && "bg-white/10 text-white",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  role,
  name,
  email,
  imageUrl,
  children,
}: {
  role: Role;
  name: string;
  email: string;
  imageUrl: string | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      <aside className="hidden bg-sidebar text-sidebar-foreground md:flex md:flex-col md:px-4 md:py-5">
        <Link href={dashboardPath(role)} className="px-2">
          <Logo light />
        </Link>
        <div className="mt-8 flex flex-1 flex-col">
          <NavLinks role={role} />
        </div>
        <div className="mt-4 flex items-center gap-3 border-t border-white/10 px-2 pt-4">
          <Avatar className="h-9 w-9">
            {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
            <AvatarFallback>{initials || "M"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{name}</p>
            <p className="truncate text-xs text-stone-400">{ROLE_LABELS[role]}</p>
          </div>
          <form action={logout}>
            <button className="rounded-md p-2 text-stone-400 hover:bg-white/5 hover:text-white" aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <Logo />
          <button onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
        </header>
        {open ? (
          <div className="fixed inset-0 z-50 bg-stone-950/50 md:hidden" onClick={() => setOpen(false)}>
            <div
              className="flex h-full w-72 flex-col bg-sidebar p-4 text-sidebar-foreground"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <Logo light />
                <button onClick={() => setOpen(false)} aria-label="Close navigation">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavLinks role={role} onNavigate={() => setOpen(false)} />
              <form action={logout} className="mt-4">
                <Button variant="secondary" className="w-full" type="submit">
                  Log out
                </Button>
              </form>
            </div>
          </div>
        ) : null}
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
        <p className="sr-only">{email}</p>
      </div>
    </div>
  );
}
