'use client';

import { 
  TruckIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

interface FleetStatsProps {
  stats: {
    totalVehicles: number;
    activeVehicles: number;
    totalDrivers: number;
    activeDrivers: number;
    totalExpenses: number;
    totalIncome: number;
    pendingRemittances: number;
  };
}

export function FleetStats({ stats }: FleetStatsProps) {
  const cards = [
    {
      name: 'Total Vehicles',
      value: stats.totalVehicles,
      active: stats.activeVehicles,
      icon: TruckIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Total Drivers',
      value: stats.totalDrivers,
      active: stats.activeDrivers,
      icon: UserGroupIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      name: 'Total Income',
      value: `$${stats.totalIncome.toLocaleString()}`,
      active: null,
      icon: CurrencyDollarIcon,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      name: 'Pending Remittances',
      value: stats.pendingRemittances,
      active: null,
      icon: ClockIcon,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div key={card.name} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 rounded-md ${card.bgColor}`}>
              <card.icon className={`h-6 w-6 ${card.textColor}`} />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">{card.name}</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {card.value}
                </p>
                {card.active !== null && (
                  <p className="ml-2 text-sm text-gray-500">
                    ({card.active} active)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}