import { AdminDashboardShell } from "@/components/layout/AdminDashboardShell";
import { getCurrentUser, requireRole } from "@/lib/auth-helpers";
import type { PropsWithChildren } from "react";

export default async function AdminLayout({ children }: PropsWithChildren) {
  await requireRole("SUPER_ADMIN");
  const user = await getCurrentUser();

  return <AdminDashboardShell user={user}>{children}</AdminDashboardShell>;
}
