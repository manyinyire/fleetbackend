"use client";

import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "@/theme";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { useBackgroundSync } from "@/hooks/use-background-sync";

function BackgroundSyncProvider({ children }: { children: React.ReactNode }) {
  useBackgroundSync();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <ThemeProvider defaultTheme="light" attribute="class">
          <SidebarProvider>
            <BackgroundSyncProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#1e293b",
                    color: "#fff",
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: "#10B981",
                      secondary: "#fff",
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: "#EF4444",
                      secondary: "#fff",
                    },
                  },
                }}
              />
            </BackgroundSyncProvider>
          </SidebarProvider>
        </ThemeProvider>
      </ChakraProvider>
    </CacheProvider>
  );
}
