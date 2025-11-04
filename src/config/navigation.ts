import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ChartPie,
  ClipboardList,
  Cog,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Flag,
  Gauge,
  Grid2x2,
  Home,
  LifeBuoy,
  MailPlus,
  Receipt,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Telescope,
  Users,
  UserCircle,
  Wallet,
  Wrench,
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
      { label: "Tenants", href: "/admin/tenants", icon: Building2 },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Admin Users", href: "/admin/admin-users", icon: UserCircle },
      { label: "System Settings", href: "/admin/settings", icon: Cog },
    ],
  },
  {
    title: "Monitoring",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "System Health", href: "/admin/system-health", icon: Activity },
      { label: "Performance", href: "/admin/performance", icon: Gauge },
      { label: "Error Logs", href: "/admin/error-logs", icon: AlertTriangle },
      { label: "Security", href: "/admin/security", icon: ShieldCheck },
    ],
  },
  {
    title: "Financial",
    items: [
      { label: "Payments", href: "/admin/payments", icon: Wallet },
      { label: "Reconciliation", href: "/admin/reconciliation", icon: Receipt },
      { label: "Revenue", href: "/admin/revenue", icon: DollarSign },
      { label: "Subscriptions", href: "/admin/subscriptions", icon: ChartPie },
    ],
  },
  {
    title: "Engagement",
    items: [
      { label: "Content", href: "/admin/content", icon: FileText },
      { label: "Email Templates", href: "/admin/email-templates", icon: MailPlus },
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "Themes", href: "/admin/themes", icon: Sparkles },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "Search Tool", href: "/admin/search", icon: Search },
      { label: "Database Browser", href: "/admin/database", icon: Server },
      { label: "API Tester", href: "/admin/api-tester", icon: Telescope },
      { label: "Report Builder", href: "/admin/report-builder", icon: Grid2x2 },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Documentation", href: "/admin/docs", icon: BookOpen },
      { label: "Support", href: "/admin/support", icon: LifeBuoy },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
    ],
  },
];
