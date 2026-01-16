import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  type: string;
  status?: string;
  currentMileage?: number;
  initialCost: number;
  paymentModel?: string;
  paymentConfig?: any;
  drivers?: Array<{
    driver: {
      id: string;
      fullName: string;
    };
  }>;
  maintenanceRecords?: Array<{
    id: string;
    type: string;
    date: string;
    cost: number;
  }>;
  _count?: {
    remittances: number;
    expenses: number;
  };
}

interface VehiclesFilters {
  status?: string;
  type?: string;
  search?: string;
}

export function useVehicles(filters?: VehiclesFilters) {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.type) params.set('type', filters.type);
      if (filters?.search) params.set('search', filters.search);

      const response = await fetch(`/api/vehicles?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      return response.json() as Promise<Vehicle[]>;
    },
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: async () => {
      const response = await fetch(`/api/vehicles/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch vehicle');
      }
      return response.json() as Promise<Vehicle>;
    },
    enabled: !!id,
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Vehicle> }) => {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update vehicle');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', variables.id] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete vehicle');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}
