'use client';

import { 
  TruckIcon, 
  UserGroupIcon, 
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  type: string;
  status: string;
  currentMileage: number;
  drivers: Array<{
    driver: {
      id: string;
      fullName: string;
    };
  }>;
  maintenanceRecords: Array<{
    id: string;
    type: string;
    date: string;
    cost: number;
  }>;
  _count: {
    remittances: number;
    expenses: number;
  };
}

interface VehiclesTableProps {
  vehicles: Vehicle[];
}

export function VehiclesTable({ vehicles }: VehiclesTableProps) {
  const getStatusColor = (status: string) => {
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

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {vehicles.length === 0 ? (
        <div className="text-center py-12">
          <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first vehicle to the fleet.
          </p>
          <div className="mt-6">
            <a
              href="/vehicles/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <TruckIcon className="h-4 w-4 mr-2" />
              Add Vehicle
            </a>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {vehicles.map((vehicle) => (
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
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <TruckIcon className="h-3 w-3 mr-1" />
                        {vehicle.currentMileage.toLocaleString()} miles
                      </span>
                      <span className="flex items-center">
                        <UserGroupIcon className="h-3 w-3 mr-1" />
                        {vehicle.drivers.length} driver{vehicle.drivers.length !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center">
                        <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                        {vehicle._count.remittances} remittances
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {vehicle.drivers.length > 0 ? vehicle.drivers[0].driver.fullName : 'No driver'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {vehicle.maintenanceRecords.length > 0 && (
                        <>
                          Last service: {new Date(vehicle.maintenanceRecords[0].date).toLocaleDateString()}
                        </>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}