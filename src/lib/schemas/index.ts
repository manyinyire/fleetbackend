/**
 * Centralized Schema Exports
 * 
 * Single source of truth for all validation schemas.
 * Import from here instead of individual schema files.
 */

// Vehicle schemas
export * from './vehicle';

// Driver schemas
export * from './driver';

// Remittance schemas
export * from './remittance';

// Maintenance schemas
export * from './maintenance';

// Expense schemas
export * from './expense';

// Income schemas
export * from './income';

// Invoice schemas
export * from './invoice';

// Payment schemas
export * from './payment';

// Auth schemas
export * from './auth';

// Tenant schemas
export * from './tenant';

// Common schemas (pagination, filters, etc.)
export * from './common';
