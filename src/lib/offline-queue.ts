import Dexie, { Table } from 'dexie';

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
      actions: '++id, type, timestamp, synced'
    });
  }
}

export const offlineQueue = new OfflineQueue();

// Add action to queue
export async function queueAction(
  type: QueuedAction['type'],
  data: any
) {
  await offlineQueue.actions.add({
    type,
    data,
    timestamp: Date.now(),
    synced: false
  });
}

// Get all pending actions
export async function getPendingActions() {
  return await offlineQueue.actions
    .where('synced')
    .equals(false)
    .toArray();
}

// Mark action as synced
export async function markAsSynced(id: number) {
  await offlineQueue.actions.update(id, { synced: true });
}

// Mark action as failed
export async function markAsFailed(id: number, error: string) {
  await offlineQueue.actions.update(id, { error });
}