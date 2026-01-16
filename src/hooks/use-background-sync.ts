'use client';

import { useEffect } from 'react';
import { useOnlineStatus } from './use-online-status';

export function useBackgroundSync() {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!isOnline || typeof window === 'undefined') return;

    async function syncPendingActions() {
      try {
        // Dynamically import to avoid SSR issues
        const { getPendingActions, markAsSynced, markAsFailed } = await import('@/lib/offline-queue');
        
        const pending = await getPendingActions();
      
              for (const action of pending) {
          try {
            // Sync based on action type
            switch (action.type) {
              case 'remittance':
                await syncRemittance(action.data);
                break;
              case 'mileage':
                await syncMileage(action.data);
                break;
              case 'expense':
                await syncExpense(action.data);
                break;
              case 'incident':
                await syncIncident(action.data);
                break;
            }

            await markAsSynced(action.id!);
          } catch (error) {
            await markAsFailed(action.id!, error instanceof Error ? error.message : 'Unknown error');                                                             
          }
        }
      } catch (error) {
        // Silent fail
      }
    }

    syncPendingActions();
  }, [isOnline]);
}

// Placeholder sync functions - implement based on your API
async function syncRemittance(data: any) {
  const response = await fetch('/api/remittances', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to sync remittance');
  }
}

async function syncMileage(data: any) {
  const response = await fetch('/api/vehicles/mileage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to sync mileage');
  }
}

async function syncExpense(data: any) {
  const response = await fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to sync expense');
  }
}

async function syncIncident(data: any) {
  const response = await fetch('/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to sync incident');
  }
}