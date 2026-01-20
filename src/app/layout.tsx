import "@/css/satoshi.css";
import "@/css/style.css";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata, Viewport } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";
import { Suspense } from 'react';
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { GoogleAnalytics } from "@/components/google-analytics";
import { getPlatformSettingsWithDefaults } from "@/lib/platform-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettingsWithDefaults();
  
  return {
    title: {
      template: `%s | ${settings.platformName}`,
      default: settings.platformName,
    },
    description:
      `Manage your fleet, drivers, and finances efficiently with ${settings.platformName} - the complete fleet management solution.`,
    icons: {
      icon: "/favicon.ico",
      apple: "/icons/icon-192x192.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: settings.platformName,
    },
    manifest: "/manifest.json",
    other: {
      "mobile-web-app-capable": "yes",
      "msapplication-TileColor": "#1e3a8a",
      "msapplication-tap-highlight": "no",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e3a8a",
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const settings = await getPlatformSettingsWithDefaults();
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <NextTopLoader color="#1e3a8a" showSpinner={false} />
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          <Suspense fallback={null}>
            <GoogleAnalytics />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
