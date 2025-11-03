import type { LucideIcon } from "lucide-react";
import {
  Home,
  Car,
  Users,
  Wallet,
  Wrench,
  PieChart,
  Settings,
  UserCircle,
  ShieldCheck,
  Activity,
  Receipt,
  BarChart3,
  Bell,
  Flag,
  FileSpreadsheet,
} from "lucide-react";

export type NavChild = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const tenantNav: NavSection[] = [
  {
    title: "Fleet Management",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Vehicles", href: "/vehicles", icon: Car },
      { label: "Drivers", href: "/drivers", icon: Users },
      { label: "Remittances", href: "/remittances", icon: Wallet },
      { label: "Maintenance", href: "/maintenance", icon: Wrench },
      {
        label: "Finances",
        href: "/finances",
        icon: PieChart,
        children: [
          { label: "Transactions", href: "/finances/transactions" },
          { label: "Reports", href: "/finances/reports" },
        ],
      },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Profile", href: "/profile", icon: UserCircle },
    ],
  },
];

export const superAdminNav: NavSection[] = [
  {
    title: "System Administration",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: Home },
      { label: "Tenants", href: "/admin/tenants", icon: Users },
      { label: "Users", href: "/admin/users", icon: UserCircle },
      { label: "System Settings", href: "/admin/settings", icon: Settings },
    ],
  },
  {
    title: "Monitoring",
    items: [
      { label: "System Health", href: "/admin/system-health", icon: Activity },
      { label: "Performance", href: "/admin/performance", icon: BarChart3 },
      { label: "Security", href: "/admin/security", icon: ShieldCheck },
    ],
  },
  {
    title: "Financial",
    items: [
      { label: "Payments", href: "/admin/payments", icon: Wallet },
      { label: "Reconciliation", href: "/admin/reconciliation", icon: Receipt },
      { label: "Subscriptions", href: "/admin/subscriptions", icon: PieChart },
    ],
  },
  {
    title: "Engagement",
    items: [
      { label: "Email Templates", href: "/admin/email-templates", icon: FileSpreadsheet },
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "Feature Flags", href: "/admin/feature-flags", icon: Flag },
    ],
  },
];
