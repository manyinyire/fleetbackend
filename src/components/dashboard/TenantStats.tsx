"use client";

import { SimpleGrid } from "@chakra-ui/react";
import { Car, CheckCircle2, DollarSign, Users } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";

type TenantStatsProps = {
  stats: {
    totalVehicles: number;
    activeVehicles: number;
    totalDrivers: number;
    activeDrivers: number;
    totalIncome: number;
    totalExpenses: number;
    pendingRemittances: number;
  };
};

export function TenantStats({ stats }: TenantStatsProps) {
  const netIncome = stats.totalIncome - stats.totalExpenses;

  const items = [
    {
      label: "Total Vehicles",
      value: stats.totalVehicles,
      helper: `${stats.activeVehicles} active`,
      icon: Car,
    },
    {
      label: "Total Drivers",
      value: stats.totalDrivers,
      helper: `${stats.activeDrivers} active`,
      icon: Users,
    },
    {
      label: "Net Income",
      value: `$${netIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      helper: `Expenses: $${stats.totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
    },
    {
      label: "Pending Remittances",
      value: stats.pendingRemittances,
      helper: stats.pendingRemittances ? "Awaiting approval" : "All remittances cleared",
      icon: CheckCircle2,
    },
  ];

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={6}>
      {items.map((item) => (
        <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} helperText={item.helper} />
      ))}
    </SimpleGrid>
  );
}
