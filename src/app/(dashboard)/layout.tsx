import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import type { PropsWithChildren } from "react";
import { requireTenantForDashboard } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: PropsWithChildren) {
  // Ensure user is authenticated and has tenant access
  // This will automatically redirect SUPER_ADMIN to /superadmin/dashboard
  await requireTenantForDashboard();

  return (
    <div className="flex min-h-screen bg-atmospheric">
      <Sidebar />

      <div className="w-full bg-white bg-organic-texture dark:bg-[#020d1a]">
        <Header />

        <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          <div className="stagger-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
