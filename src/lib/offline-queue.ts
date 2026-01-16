import Dexie, { Table } from 'dexie';
import { apiLogger } from '@/lib/logger';

interface QueuedAction {
  id?: number;
  type: 'remittance' | 'mileage' | 'expense' | 'incident';
  data: any;
  timestamp: number;
  synced: boolean;
  error?: string;
}

class OfflineQueue extends Dexie {
  actions!: Table<QueuedAction>;

  constructor() {
    super('AzaireOfflineQueue');
    this.version(1).stores({
      actions: '++id, type, timestamp, [synced+timestamp]'
    });
  }
}

// Only create instance in browser
let offlineQueue: OfflineQueue | null = null;

if (typeof window !== 'undefined') {
  offlineQueue = new OfflineQueue();
}

export { offlineQueue };

// Add action to queue
export async function queueAction(
  type: QueuedAction['type'],
  data: any
) {
  if (!offlineQueue) return;
  
  await offlineQueue.actions.add({
    type,
    data,
    timestamp: Date.now(),
    synced: false
  });
}

// Get all pending actions
export async function getPendingActions() {
  if (!offlineQueue) return [];
  
  try {
    // Get all actions that haven't been synced yet
    return await offlineQueue.actions
      .filter(action => action.synced === false)
      .toArray();
  } catch (error) {
    apiLogger.error({ err: error }, 'Error fetching pending actions:');
    return [];
  }
}

// Mark action as synced
export async function markAsSynced(id: number) {
  if (!offlineQueue) return;
  
  await offlineQueue.actions.update(id, { synced: true });
}

// Mark action as failed
export async function markAsFailed(id: number, error: string) {
  if (!offlineQueue) return;
  
  await offlineQueue.actions.update(id, { error });
}
