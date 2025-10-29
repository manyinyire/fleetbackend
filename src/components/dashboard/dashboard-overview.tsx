'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TruckIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  type: string;
  status: string;
  drivers: Array<{
    driver: {
      id: string;
      fullName: string;
    };
  }>;
}

interface Driver {
  id: string;
  fullName: string;
  phone: string;
  status: string;
  vehicles: Array<{
    vehicle: {
      id: string;
      registrationNumber: string;
    };
  }>;
}

interface DashboardOverviewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
}

export function DashboardOverview({ vehicles, drivers }: DashboardOverviewProps) {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vehicles'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TruckIcon className="h-5 w-5 inline mr-2" />
            Vehicles ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'drivers'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserGroupIcon className="h-5 w-5 inline mr-2" />
            Drivers ({drivers.length})
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            {vehicles.length === 0 ? (
              <div className="text-center py-8">
                <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first vehicle.
                </p>
                <div className="mt-6">
                  <Link
                    href="/vehicles/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add Vehicle
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Driver
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {vehicle.registrationNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {vehicle.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            vehicle.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800'
                              : vehicle.status === 'UNDER_MAINTENANCE'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {vehicle.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.drivers.length > 0 ? (
                            vehicle.drivers.map((assignment, index) => (
                              <div key={index}>
                                {assignment.driver.fullName}
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400">No driver assigned</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="space-y-4">
            {drivers.length === 0 ? (
              <div className="text-center py-8">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No drivers</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first driver.
                </p>
                <div className="mt-6">
                  <Link
                    href="/drivers/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add Driver
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Driver
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {drivers.map((driver) => (
                      <tr key={driver.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {driver.fullName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {driver.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            driver.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800'
                              : driver.status === 'INACTIVE'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {driver.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {driver.vehicles.length > 0 ? (
                            driver.vehicles.map((assignment, index) => (
                              <div key={index}>
                                {assignment.vehicle.registrationNumber}
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400">No vehicle assigned</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}