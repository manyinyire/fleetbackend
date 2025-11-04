'use client';

import { 
  PlusIcon, 
  TruckIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export function QuickActions() {
  const actions = [
    {
      name: 'Add Vehicle',
      href: '/vehicles/new',
      icon: TruckIcon,
      color: 'bg-blue-500',
      description: 'Register a new vehicle'
    },
    {
      name: 'Add Driver',
      href: '/drivers/new',
      icon: UserGroupIcon,
      color: 'bg-green-500',
      description: 'Register a new driver'
    },
    {
      name: 'Record Remittance',
      href: '/remittances/new',
      icon: CurrencyDollarIcon,
      color: 'bg-emerald-500',
      description: 'Log driver payment'
    },
    {
      name: 'Schedule Maintenance',
      href: '/maintenance/new',
      icon: WrenchScrewdriverIcon,
      color: 'bg-amber-500',
      description: 'Book vehicle service'
    },
    {
      name: 'Generate Report',
      href: '/finances/reports',
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
      description: 'Create fleet report'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        <p className="mt-1 text-sm text-gray-500">
          Common tasks to manage your fleet
        </p>
      </div>
      
      <div className="p-6">
        <div className="space-y-3">
          {actions.map((action) => (
            <a
              key={action.name}
              href={action.href}
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className={`flex-shrink-0 p-2 rounded-md ${action.color}`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-900">{action.name}</p>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
              <PlusIcon className="h-4 w-4 text-gray-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}