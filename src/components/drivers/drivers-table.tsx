'use client';

import {
  UserGroupIcon,
  PhoneIcon,
  TruckIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Driver {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  status: string;
  debtBalance: number;
  vehicles?: Array<{
    isPrimary: boolean;
    endDate: string | null;
    vehicle: {
      id: string;
      registrationNumber: string;
      paymentModel: string;
    };
  }>;
  remittances?: Array<{
    id: string;
    amount: number;
    date: string;
    status: string;
  }>;
  _count?: {
    remittances: number;
    contracts: number;
  };
}

interface DriversTableProps {
  drivers: Driver[];
}

export function DriversTable({ drivers }: DriversTableProps) {
  // Ensure drivers is always an array
  const driversList = Array.isArray(drivers) ? drivers : [];

  if (!Array.isArray(drivers)) {
    console.error('DriversTable received non-array:', drivers);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800';
      case 'TERMINATED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentModelLabel = (model: string) => {
    switch (model) {
      case 'OWNER_PAYS':
        return 'Owner Pays';
      case 'DRIVER_REMITS':
        return 'Driver Remits';
      case 'HYBRID':
        return 'Hybrid';
      default:
        return model;
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {driversList.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No drivers</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first driver to the system.
          </p>
          <div className="mt-6">
            <Link
              href="/drivers/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <UserGroupIcon className="h-4 w-4 mr-2" />
              Add Driver
            </Link>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {driversList.map((driver, index) => (
            <li key={driver.id || `driver-${index}`}>
              <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {driver.fullName}
                      </p>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(driver.status)}`}>
                        {driver.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <PhoneIcon className="h-3 w-3 mr-1" />
                        {driver.phone}
                      </span>
                      {driver.email && (
                        <span className="flex items-center">
                          {driver.email}
                        </span>
                      )}
                      <span className="flex items-center">
                        <TruckIcon className="h-3 w-3 mr-1" />
                        {driver.vehicles?.length || 0} vehicle{(driver.vehicles?.length || 0) !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center">
                        <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                        {driver._count?.remittances || 0} remittances
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {(() => {
                        // Payment model is now on vehicle - get from primary assigned vehicle
                        const primaryVehicle = driver.vehicles?.find(v => v.isPrimary && !v.endDate)?.vehicle 
                          || driver.vehicles?.[0]?.vehicle;
                        const paymentModel = primaryVehicle?.paymentModel || null;
                        return paymentModel ? (
                          <>
                            Payment Model: {getPaymentModelLabel(paymentModel)}
                            {driver.debtBalance > 0 && (
                              <span className="ml-2 text-red-600">
                                (Debt: ${driver.debtBalance.toFixed(2)})
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-gray-400">No vehicle assigned</span>
                            {driver.debtBalance > 0 && (
                              <span className="ml-2 text-red-600">
                                (Debt: ${driver.debtBalance.toFixed(2)})
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {driver.vehicles && driver.vehicles.length > 0 ? driver.vehicles[0].vehicle.registrationNumber : 'No vehicle'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {driver.remittances && driver.remittances.length > 0 && (
                        <>
                          Last remittance: ${driver.remittances[0].amount} ({new Date(driver.remittances[0].date).toLocaleDateString()})
                        </>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Link
                      href={`/drivers/${driver.id}`}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="View Driver"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/drivers/${driver.id}/edit`}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Edit Driver"
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
  );
}