/**
 * UI State Store
 *
 * Global UI state management using Zustand
 * Handles sidebar, loading states, modals, etc.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // Modal states
  activeModal: string | null;
  openModal: (modalName: string) => void;
  closeModal: () => void;

  // Theme  (next-themes handles this, but we can track it)
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Notifications
  notificationCount: number;
  setNotificationCount: (count: number) => void;
  incrementNotifications: () => void;
  decrementNotifications: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Loading
      globalLoading: false,
      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      // Modals
      activeModal: null,
      openModal: (modalName) => set({ activeModal: modalName }),
      closeModal: () => set({ activeModal: null }),

      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Notifications
      notificationCount: 0,
      setNotificationCount: (count) => set({ notificationCount: count }),
      incrementNotifications: () =>
        set((state) => ({ notificationCount: state.notificationCount + 1 })),
      decrementNotifications: () =>
        set((state) => ({
          notificationCount: Math.max(0, state.notificationCount - 1),
        })),
    }),
    {
      name: 'ui-storage', // localStorage key
      partialize: (state) => ({
        // Only persist these values
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    }
  )
);
