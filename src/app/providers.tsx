"use client";

import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { useBackgroundSync } from "@/hooks/use-background-sync";
import SessionProvider from "@/components/Providers/SessionProvider";
import { QueryProvider } from "@/components/Providers/QueryProvider";
import { NuqsAdapter } from 'nuqs/adapters/next/app';

function BackgroundSyncProvider({ children }: { children: React.ReactNode }) {
  useBackgroundSync();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <NuqsAdapter>
          <ThemeProvider defaultTheme="light" attribute="class">
            <SidebarProvider>
              <BackgroundSyncProvider>
                {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#10B981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#EF4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </BackgroundSyncProvider>
            </SidebarProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </QueryProvider>
    </SessionProvider>
  );
}
