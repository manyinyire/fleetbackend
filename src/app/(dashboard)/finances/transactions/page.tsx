import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

export default async function FinancesTransactionsPage() {
  const { user, tenantId } = await requireTenant();

  // Set RLS context
  await setTenantContext(tenantId);

  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch expenses and income
  const [expenses, incomes] = await Promise.all([
    prisma.expense.findMany({
      include: {
        vehicle: true,
      },
      orderBy: { date: 'desc' },
      take: 50,
    }),
    prisma.income.findMany({
      include: {
        vehicle: true,
      },
      orderBy: { date: 'desc' },
      take: 50,
    }),
  ]);

  // Combine and sort transactions
  const transactions = [
    ...expenses.map((e) => ({
      ...e,
      type: 'EXPENSE' as const,
    })),
    ...incomes.map((i) => ({
      ...i,
      type: 'INCOME' as const,
      category: i.source,
      status: 'APPROVED' as const,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const stats = {
    totalIncome: incomes.reduce((sum, i) => sum + Number(i.amount), 0),
    totalExpenses: expenses
      .filter((e) => e.status === 'APPROVED')
      .reduce((sum, e) => sum + Number(e.amount), 0),
    pendingExpenses: expenses.filter((e) => e.status === 'PENDING').length,
    netProfit: function () {
      return this.totalIncome - this.totalExpenses;
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-5 font-bold text-dark dark:text-white">
            Income & Expenses
          </h1>
          <p className="text-body-sm text-dark-5 dark:text-dark-6">
            Track all financial transactions
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/finances/transactions/expense/new"
            className="inline-flex items-center gap-2 rounded-[7px] border border-stroke px-4.5 py-[7px] font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Expense
          </Link>
          <Link
            href="/finances/transactions/income/new"
            className="inline-flex items-center gap-2 rounded-[7px] bg-primary px-4.5 py-[7px] font-medium text-gray-2 hover:bg-opacity-90"
          >
            <PlusIcon className="h-5 w-5" />
            Add Income
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-light-6">
              <svg
                className="h-6 w-6 text-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">
                Total Income
              </p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                ${stats.totalIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-light-5">
              <svg
                className="h-6 w-6 text-red"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">
                Total Expenses
              </p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                ${stats.totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                stats.netProfit() >= 0 ? 'bg-blue-light-5' : 'bg-yellow-light-4'
              }`}
            >
              <svg
                className={`h-6 w-6 ${
                  stats.netProfit() >= 0 ? 'text-blue' : 'text-yellow-dark'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">
                Net Profit
              </p>
              <p
                className={`text-heading-6 font-bold ${
                  stats.netProfit() >= 0 ? 'text-green' : 'text-red'
                }`}
              >
                ${Math.abs(stats.netProfit()).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-light-4">
              <svg
                className="h-6 w-6 text-yellow-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">
                Pending Expenses
              </p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                {stats.pendingExpenses}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark">
        <div className="px-4 py-6 md:px-6 xl:px-9">
          <h4 className="text-body-2xlg font-bold text-dark dark:text-white">
            Recent Transactions
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-t border-stroke dark:border-dark-3">
                <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                  Date
                </th>
                <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                  Type
                </th>
                <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                  Category
                </th>
                <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                  Description
                </th>
                <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                  Vehicle
                </th>
                <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                  Amount
                </th>
                <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-dark-5">
                    No transactions found. Add your first transaction to get started.
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr
                    key={`${transaction.type}-${transaction.id}`}
                    className="border-t border-stroke dark:border-dark-3"
                  >
                    <td className="px-4 py-5">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-body-sm font-medium ${
                          transaction.type === 'INCOME'
                            ? 'bg-green-light-6 text-green'
                            : 'bg-red-light-5 text-red'
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      {transaction.category.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-5 max-w-xs truncate">
                      {transaction.description || '-'}
                    </td>
                    <td className="px-4 py-5">
                      {transaction.vehicle?.registrationNumber || '-'}
                    </td>
                    <td className="px-4 py-5 font-medium">
                      {transaction.type === 'INCOME' ? '+' : '-'}$
                      {Number(transaction.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-body-sm font-medium ${
                          transaction.status === 'APPROVED'
                            ? 'bg-green-light-6 text-green'
                            : transaction.status === 'PENDING'
                            ? 'bg-yellow-light-4 text-yellow-dark'
                            : 'bg-red-light-5 text-red'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
