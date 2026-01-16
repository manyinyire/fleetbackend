'use client';

import {
  TruckIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PencilIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { formatDate } from '@/lib/date-utils';
import { useQueryState, parseAsString } from 'nuqs';
import { useMemo } from 'react';

interface Vehicle {
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

interface VehiclesTableWithFiltersProps {
  vehicles: Vehicle[];
}

export function VehiclesTableWithFilters({ vehicles }: VehiclesTableWithFiltersProps) {
  // URL state management with nuqs - filters persist in URL and are shareable!
  const [statusFilter, setStatusFilter] = useQueryState('status', parseAsString.withDefault(''));
  const [typeFilter, setTypeFilter] = useQueryState('type', parseAsString.withDefault(''));
  const [searchQuery, setSearchQuery] = useQueryState('search', parseAsString.withDefault(''));

  // Filter vehicles based on URL state
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    if (statusFilter) {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    if (typeFilter) {
      filtered = filtered.filter((v) => v.type === typeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.registrationNumber.toLowerCase().includes(query) ||
          v.make.toLowerCase().includes(query) ||
          v.model.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [vehicles, statusFilter, typeFilter, searchQuery]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'UNDER_MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'DECOMMISSIONED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CAR':
        return '🚗';
      case 'OMNIBUS':
        return '🚌';
      case 'BIKE':
        return '🏍️';
      default:
        return '🚗';
    }
  };

  const clearFilters = () => {
    setStatusFilter(null);
    setTypeFilter(null);
    setSearchQuery(null);
  };

  const hasActiveFilters = statusFilter || typeFilter || searchQuery;

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value || null)}
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="DECOMMISSIONED">Decommissioned</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Types</option>
            <option value="CAR">Car</option>
            <option value="OMNIBUS">Omnibus</option>
            <option value="BIKE">Bike</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear filters
            </button>
          )}

          {/* Results Count */}
          <div className="ml-auto text-sm text-gray-500">
            {filteredVehicles.length} of {vehicles.length} vehicles
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {hasActiveFilters ? 'No vehicles match your filters' : 'No vehicles'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by adding your first vehicle to the fleet.'}
            </p>
            {hasActiveFilters ? (
              <div className="mt-6">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <Link
                  href="/vehicles/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <TruckIcon className="h-4 w-4 mr-2" />
                  Add Vehicle
                </Link>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredVehicles.map((vehicle) => (
              <li key={vehicle.id}>
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-lg">{getTypeIcon(vehicle.type)}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {vehicle.registrationNumber}
                        </p>
                        <span
                          className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status || 'ACTIVE')}`}
                        >
                          {(vehicle.status || 'ACTIVE').replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <TruckIcon className="h-3 w-3 mr-1" />
                          {(vehicle.currentMileage || 0).toLocaleString()} miles
                        </span>
                        <span className="flex items-center">
                          <UserGroupIcon className="h-3 w-3 mr-1" />
                          {vehicle.drivers?.length || 0} driver
                          {(vehicle.drivers?.length || 0) !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center">
                          <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                          {vehicle._count?.remittances || 0} remittances
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {vehicle.drivers && vehicle.drivers.length > 0 && vehicle.drivers[0]?.driver
                          ? vehicle.drivers[0].driver.fullName
                          : 'No driver'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {vehicle.maintenanceRecords &&
                          vehicle.maintenanceRecords.length > 0 &&
                          vehicle.maintenanceRecords[0] && (
                            <>Last service: {formatDate(vehicle.maintenanceRecords[0].date)}</>
                          )}
                      </p>
                    </div>

                    <div className="flex space-x-1">
                      <Link
                        href={`/vehicles/${vehicle.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="View Vehicle"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/vehicles/${vehicle.id}/edit`}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Edit Vehicle"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
