'use client';

import { useRouter } from 'next/navigation';

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

interface RemittancesTableProps {
  remittances: Remittance[];
}

export function RemittancesTable({ remittances }: RemittancesTableProps) {
  const router = useRouter();

  const handleRowClick = (remittanceId: string) => {
    router.push(`/remittances/${remittanceId}`);
  };

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Driver
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vehicle
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {remittances.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                No remittances found. Add your first remittance to get started.
              </td>
            </tr>
          ) : (
            remittances.map((remittance) => (
              <tr
                key={remittance.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleRowClick(remittance.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(remittance.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {remittance.driver.fullName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {remittance.vehicle.registrationNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${Number(remittance.amount).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      remittance.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : remittance.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {remittance.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
