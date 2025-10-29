import { AdminSidebar } from "@/components/Layouts/admin-sidebar";
import { Header } from "@/components/Layouts/header";
import type { PropsWithChildren } from "react";
import { requireRole } from '@/lib/auth-helpers';

export default async function AdminLayout({ children }: PropsWithChildren) {
  // Ensure user has SUPER_ADMIN role
  await requireRole('SUPER_ADMIN');

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />

      <div className="ml-64 w-full bg-gray-2 dark:bg-[#020d1a]">
        <Header />

        <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
