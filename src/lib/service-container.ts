/**
 * Service Container (Dependency Injection Container)
 *
 * Provides centralized access to all service instances with proper
 * dependency injection. This ensures:
 * - Consistent service instantiation
 * - Proper tenant isolation
 * - Easy testing (can mock entire container)
 * - Single source of truth for service dependencies
 */

import { DriverService } from '@/services/driver.service';
import { VehicleService } from '@/services/vehicle.service';
import { MaintenanceService } from '@/services/maintenance.service';
import { FinancialService } from '@/services/financial.service';
import { SubscriptionService } from '@/services/subscription.service';
import { RemittanceService } from '@/services/remittance.service';
import { AdminService } from '@/services/admin.service';
import { WeeklyTargetService } from '@/services/weekly-target.service';

/**
 * Service Container
 *
 * Instantiates and manages all service instances for a specific tenant.
 * All services are lazily instantiated on first access.
 *
 * @example
 * ```typescript
 * const services = new ServiceContainer(tenantId);
 * const driver = await services.drivers.create(driverData, userId);
 * const vehicles = await services.vehicles.getAll({ page: 1, limit: 10 });
 * ```
 */
export class ServiceContainer {
  private tenantId: string | null;

  // Lazy-loaded service instances
  private _driverService?: DriverService;
  private _vehicleService?: VehicleService;
  private _maintenanceService?: MaintenanceService;
  private _financialService?: FinancialService;
  private _subscriptionService?: SubscriptionService;
  private _remittanceService?: RemittanceService;
  private _adminService?: AdminService;
  private _weeklyTargetService?: WeeklyTargetService;

  constructor(tenantId: string | null) {
    this.tenantId = tenantId;
  }

  /**
   * Driver Service
   * Handles all driver-related business logic
   */
  get drivers(): DriverService {
    if (!this._driverService) {
      this._driverService = new DriverService(this.tenantId);
    }
    return this._driverService;
  }

  /**
   * Vehicle Service
   * Handles all vehicle-related business logic
   */
  get vehicles(): VehicleService {
    if (!this._vehicleService) {
      this._vehicleService = new VehicleService(this.tenantId);
    }
    return this._vehicleService;
  }

  /**
   * Maintenance Service
   * Handles all maintenance-related business logic
   */
  get maintenance(): MaintenanceService {
    if (!this._maintenanceService) {
      this._maintenanceService = new MaintenanceService(this.tenantId);
    }
    return this._maintenanceService;
  }

  /**
   * Financial Service
   * Handles financial calculations and reporting
   */
  get financial(): FinancialService {
    if (!this._financialService) {
      this._financialService = new FinancialService(this.tenantId);
    }
    return this._financialService;
  }

  /**
   * Subscription Service
   * Handles subscription and billing logic
   */
  get subscriptions(): SubscriptionService {
    if (!this._subscriptionService) {
      this._subscriptionService = new SubscriptionService();
    }
    return this._subscriptionService;
  }

  /**
   * Remittance Service
   * Handles driver remittance calculations
   */
  get remittances(): RemittanceService {
    if (!this._remittanceService) {
      this._remittanceService = new RemittanceService(this.tenantId);
    }
    return this._remittanceService;
  }

  /**
   * Admin Service
   * Handles admin-related operations
   */
  get admin(): AdminService {
    if (!this._adminService) {
      this._adminService = new AdminService();
    }
    return this._adminService;
  }

  /**
   * Weekly Target Service
   * Handles weekly remittance targets and debt carry-over
   */
  get weeklyTargets(): WeeklyTargetService {
    if (!this._weeklyTargetService) {
      this._weeklyTargetService = new WeeklyTargetService(this.tenantId);
    }
    return this._weeklyTargetService;
  }

  /**
   * Clear all cached service instances
   * Useful for testing or when tenant context changes
   */
  clear(): void {
    this._driverService = undefined;
    this._vehicleService = undefined;
    this._maintenanceService = undefined;
    this._financialService = undefined;
    this._subscriptionService = undefined;
    this._remittanceService = undefined;
    this._adminService = undefined;
  }
}

/**
 * Create a service container for a specific tenant
 *
 * @param tenantId - The tenant ID to scope services to
 * @returns ServiceContainer instance
 */
export function createServiceContainer(tenantId: string | null): ServiceContainer {
  return new ServiceContainer(tenantId);
}
