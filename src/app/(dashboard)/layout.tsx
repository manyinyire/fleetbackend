import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { TenantDashboardShell } from "@/components/layout/TenantDashboardShell";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  if ((user as any).role === "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  return <TenantDashboardShell user={user}>{children}</TenantDashboardShell>;
}
