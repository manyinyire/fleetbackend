import { SuperAdminSidebar } from "@/components/superadmin/Layouts/sidebar";
import { SuperAdminHeader } from "@/components/superadmin/Layouts/header";
import { SidebarProvider } from "@/components/superadmin/Layouts/sidebar/sidebar-context";
import { ImpersonationBanner } from "@/components/superadmin/ImpersonationBanner";

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/lib/gtag";
import { AnalyticsTracker } from "@/components/analytics-tracker";

// Force dynamic rendering for all superadmin routes
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    template: "%s | Azaire Super Admin",
    default: "Azaire Super Admin",
  },
  description:
    "Super Admin portal for Azaire Fleet Manager - manage tenants, monitor system health, and oversee platform operations.",
  manifest: "/manifest.json",
  themeColor: "#1e3a8a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Azaire Super Admin",
  },
};

export default function SuperAdminLayout({ children }: PropsWithChildren) {
  return (
    <>
      {/* Google Analytics */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          />
          <Script
            id="google-analytics-superadmin"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      )}

      <NextTopLoader color="#1e3a8a" showSpinner={false} />
      <AnalyticsTracker />

      <SidebarProvider>
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
          <SuperAdminSidebar />

          <div className="w-full bg-white dark:bg-gray-800">
            <ImpersonationBanner />
            <SuperAdminHeader />

            <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}