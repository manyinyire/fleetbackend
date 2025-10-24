'use client';

import { 
  CurrencyDollarIcon, 
  WrenchScrewdriverIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Remittance {
  id: string;
  amount: number;
  date: string;
  status: string;
  driver: {
    fullName: string;
  };
  vehicle: {
    registrationNumber: string;
  };
}

interface Maintenance {
  id: string;
  type: string;
  description: string;
  cost: number;
  date: string;
  vehicle: {
    registrationNumber: string;
  };
}

interface RecentActivityProps {
  remittances: Remittance[];
  maintenance: Maintenance[];
}

export function RecentActivity({ remittances, maintenance }: RecentActivityProps) {
  // Combine and sort activities by date
  const activities = [
    ...remittances.map(r => ({
      id: r.id,
      type: 'remittance' as const,
      title: `Remittance from ${r.driver.fullName}`,
      description: `${r.vehicle.registrationNumber} - $${r.amount}`,
      date: r.date,
      status: r.status,
      icon: CurrencyDollarIcon,
      color: r.status === 'PENDING' ? 'text-amber-500' : 'text-green-500'
    })),
    ...maintenance.map(m => ({
      id: m.id,
      type: 'maintenance' as const,
      title: `${m.type.replace('_', ' ')} - ${m.vehicle.registrationNumber}`,
      description: m.description,
      date: m.date,
      status: 'completed',
      icon: WrenchScrewdriverIcon,
      color: 'text-blue-500'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        <p className="mt-1 text-sm text-gray-500">
          Latest updates from your fleet
        </p>
      </div>
      
      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
            <p className="mt-1 text-sm text-gray-500">
              Activity will appear here as you use the system.
            </p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== activities.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${activity.color}`}>
                          <activity.icon className="h-5 w-5" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-500">{activity.description}</p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={activity.date}>
                            {new Date(activity.date).toLocaleDateString()}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}