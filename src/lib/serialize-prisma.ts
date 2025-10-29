import { Decimal } from '@prisma/client/runtime/library';

/**
 * Recursively converts Prisma Decimal objects to numbers for client serialization
 */
export function serializePrismaData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof Decimal) {
    return Number(data) as T;
  }

  // Handle Date objects
  if (data instanceof Date) {
    return data.toISOString() as T;
  }

  if (Array.isArray(data)) {
    return data.map(serializePrismaData) as T;
  }

  if (typeof data === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializePrismaData(value);
    }
    return serialized as T;
  }

  return data;
}

/**
 * Helper to serialize Prisma query results
 */
export function serializePrismaResults<T>(results: T[]): T[] {
  return results.map(serializePrismaData);
}
