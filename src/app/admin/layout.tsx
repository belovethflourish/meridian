import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout roles={["admin", "super_admin"]}>{children}</AuthenticatedLayout>;
}
