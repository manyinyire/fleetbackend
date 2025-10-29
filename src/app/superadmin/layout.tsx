import "@/css/satoshi.css";
import "@/css/style.css";

import { SuperAdminSidebar } from "@/components/superadmin/Layouts/sidebar";
import { SuperAdminHeader } from "@/components/superadmin/Layouts/header";
import { SidebarProvider } from "@/components/superadmin/Layouts/sidebar/sidebar-context";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "../providers";
import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/lib/gtag";
import { AnalyticsTracker } from "@/components/analytics-tracker";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Azaire Super Admin" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1e3a8a" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
              id="google-analytics"
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
      </head>
      <body>
        <Providers>
          <NextTopLoader color="#1e3a8a" showSpinner={false} />
          <AnalyticsTracker />

          <SidebarProvider>
            <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
              <SuperAdminSidebar />

              <div className="w-full bg-white dark:bg-gray-800">
                <SuperAdminHeader />

                <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
                  {children}
                </main>
              </div>
            </div>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}