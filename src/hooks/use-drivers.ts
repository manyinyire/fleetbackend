/**
 * Driver-specific hooks
 *
 * Example of domain-specific hooks that use our generic query/mutation hooks
 */

import { useQuery } from './use-query';
import { useMutation } from './use-mutation';
import { DriverStatus } from '@prisma/client';

interface Driver {
  id: string;
  fullName: string;
  nationalId: string;
  licenseNumber: string;
  phone: string;
  email?: string;
  status: DriverStatus;
  // ... other fields
}

interface CreateDriverDTO {
  fullName: string;
  nationalId: string;
  licenseNumber: string;
  phone: string;
  email?: string;
  homeAddress?: string;
  nextOfKin?: string;
  nextOfKinPhone?: string;
  hasDefensiveLicense?: boolean;
  defensiveLicenseNumber?: string;
  defensiveLicenseExpiry?: string;
}

interface UpdateDriverDTO extends Partial<CreateDriverDTO> {
  debtBalance?: number;
}

interface DriversResponse {
  drivers: Driver[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Fetch all drivers with filters
 */
export function useDrivers(filters?: {
  status?: DriverStatus;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
  }

  const endpoint = `/api/drivers${queryParams.toString() ? `?${queryParams}` : ''}`;

  return useQuery<DriversResponse>(endpoint, {
    refetchOnMount: true,
  });
}

/**
 * Fetch single driver by ID
 */
export function useDriver(driverId: string | null, options?: { enabled?: boolean }) {
  return useQuery<Driver>(`/api/drivers/${driverId}`, {
    enabled: options?.enabled ?? !!driverId,
  });
}

/**
 * Create a new driver
 */
export function useCreateDriver(options?: {
  onSuccess?: (driver: Driver) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<Driver, CreateDriverDTO>('/api/drivers', 'POST', options);
}

/**
 * Update an existing driver
 */
export function useUpdateDriver(
  driverId: string,
  options?: {
    onSuccess?: (driver: Driver) => void;
    onError?: (error: Error) => void;
  }
) {
  return useMutation<Driver, UpdateDriverDTO>(
    `/api/drivers/${driverId}`,
    'PUT',
    options
  );
}

/**
 * Delete a driver
 */
export function useDeleteDriver(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<void, { id: string }>('/api/drivers', 'DELETE', options);
}
