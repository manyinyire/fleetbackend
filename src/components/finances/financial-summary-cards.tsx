'use client';

import { 
  CurrencyDollarIcon, 
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

interface Summary {
  totalIncome: number;
  totalExpenses: number;
  totalRemittances: number;
  netProfit: number;
}

interface FinancialSummaryCardsProps {
  summary: Summary;
}

export function FinancialSummaryCards({ summary }: FinancialSummaryCardsProps) {
  const profitMargin = summary.totalIncome > 0 ? (summary.netProfit / summary.totalIncome) * 100 : 0;
  const isProfitable = summary.netProfit > 0;

  const cards = [
    {
      name: 'Total Income',
      value: `$${summary.totalIncome.toLocaleString()}`,
      change: '+12%',
      changeType: 'positive' as const,
      icon: ArrowUpIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Total Expenses',
      value: `$${summary.totalExpenses.toLocaleString()}`,
      change: '+8%',
      changeType: 'negative' as const,
      icon: ArrowDownIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      name: 'Net Profit',
      value: `$${summary.netProfit.toLocaleString()}`,
      change: `${profitMargin.toFixed(1)}%`,
      changeType: isProfitable ? 'positive' as const : 'negative' as const,
      icon: CurrencyDollarIcon,
      color: isProfitable ? 'text-green-600' : 'text-red-600',
      bgColor: isProfitable ? 'bg-green-50' : 'bg-red-50',
    },
    {
      name: 'Remittances',
      value: `$${summary.totalRemittances.toLocaleString()}`,
      change: '+15%',
      changeType: 'positive' as const,
      icon: CurrencyDollarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-md ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {card.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {card.changeType === 'positive' ? (
                          <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                        ) : (
                          <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {card.changeType === 'positive' ? 'Increased' : 'Decreased'} by
                        </span>
                        {card.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}