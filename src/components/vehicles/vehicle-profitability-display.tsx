'use client';

import { VehicleProfitabilityData } from '@/lib/vehicle-profitability';
import { getOverallStatusDisplay, getFinancialStatusDisplay } from '@/lib/vehicle-profitability';

interface VehicleProfitabilityDisplayProps {
  profitability: VehicleProfitabilityData;
  showOverallStatus?: boolean;
  showFinancialStatus?: boolean;
  compact?: boolean;
}

export function VehicleProfitabilityDisplay({
  profitability,
  showOverallStatus = true,
  showFinancialStatus = true,
  compact = false,
}: VehicleProfitabilityDisplayProps) {
  const overallDisplay = getOverallStatusDisplay(profitability.overallStatus);
  const financialDisplay = getFinancialStatusDisplay(profitability.financialStatus);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-3">
        {showOverallStatus && (
          <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${overallDisplay.badgeColor}`}>
            {overallDisplay.label}
          </div>
        )}
        {showFinancialStatus && (
          <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${financialDisplay.badgeColor}`}>
            {financialDisplay.label}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Status - ROI-based */}
      {showOverallStatus && (
        <div className={`rounded-lg border p-4 ${overallDisplay.bgColor} border-current/20`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Overall Vehicle Status (ROI)
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Cumulative performance since purchase
              </p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`font-semibold ${overallDisplay.color}`}>
                    {overallDisplay.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Cumulative Net Profit:</span>
                  <span className={`font-semibold ${profitability.cumulativeNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${profitability.cumulativeNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">ROI:</span>
                  <span className={`font-semibold ${profitability.roiPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitability.roiPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Payback Progress</span>
                    <span>{profitability.paybackProgress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        profitability.paybackProgress >= 100
                          ? 'bg-green-600'
                          : profitability.paybackProgress >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(profitability.paybackProgress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Status - Operational */}
      {showFinancialStatus && (
        <div className={`rounded-lg border p-4 ${financialDisplay.bgColor} border-current/20`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Financial Status (Operational)
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Current period operational performance
              </p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`font-semibold ${financialDisplay.color}`}>
                    {financialDisplay.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Operational Profit:</span>
                  <span className={`font-semibold ${profitability.operationalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${profitability.operationalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                  {financialDisplay.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Breakdown */}
      <div className="rounded-lg border border-stroke bg-white p-4 dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="text-sm font-medium text-dark dark:text-white mb-3">
          Financial Breakdown
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-dark-5 dark:text-dark-6">Total Remittances:</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              +${profitability.totalRemittances.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-dark-5 dark:text-dark-6">Total Expenses:</span>
            <span className="font-medium text-red-600 dark:text-red-400">
              -${profitability.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {profitability.driverSalary > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-dark-5 dark:text-dark-6">Driver Salary:</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                -${profitability.driverSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <div className="border-t border-stroke pt-2 dark:border-dark-3" />
          <div className="flex items-center justify-between">
            <span className="font-medium text-dark dark:text-white">Net Profit:</span>
            <span className={`font-bold ${profitability.cumulativeNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${profitability.cumulativeNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
