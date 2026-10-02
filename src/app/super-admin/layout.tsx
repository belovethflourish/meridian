import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export const dynamic = "force-dynamic";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout roles={["super_admin"]}>{children}</AuthenticatedLayout>;
}
