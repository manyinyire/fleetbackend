import * as Icons from "../icons";

export const SUPER_ADMIN_NAV_DATA = [
  {
    label: "DASHBOARD",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        url: "/superadmin/dashboard",
        items: [],
      },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      {
        title: "Tenants",
        icon: Icons.BuildingOfficeIcon,
        url: "/superadmin/tenants",
        items: [],
      },
      {
        title: "Users",
        icon: Icons.UserGroupIcon,
        url: "/superadmin/users",
        items: [],
      },
      {
        title: "Subscriptions",
        icon: Icons.CreditCardIcon,
        url: "/superadmin/subscriptions",
        items: [],
      },
      {
        title: "Billing",
        icon: Icons.CurrencyDollarIcon,
        url: "/superadmin/billing",
        items: [],
      },
    ],
  },
  {
    label: "MONITORING",
    items: [
      {
        title: "Analytics",
        icon: Icons.ChartBarIcon,
        url: "/superadmin/analytics",
        items: [],
      },
      {
        title: "System Health",
        icon: Icons.ComputerDesktopIcon,
        url: "/superadmin/system-health",
        items: [],
      },
      {
        title: "Performance",
        icon: Icons.ChartBarSquareIcon,
        url: "/superadmin/performance",
        items: [],
      },
      {
        title: "Error Logs",
        icon: Icons.ExclamationTriangleIcon,
        url: "/superadmin/error-logs",
        items: [],
      },
    ],
  },
  {
    label: "PLATFORM",
    items: [
      {
        title: "Content (CMS)",
        icon: Icons.DocumentTextIcon,
        url: "/superadmin/content",
        items: [],
      },
      {
        title: "Email Templates",
        icon: Icons.EnvelopeIcon,
        url: "/superadmin/email-templates",
        items: [],
      },
      {
        title: "Notifications",
        icon: Icons.BellIcon,
        url: "/superadmin/notifications",
        items: [],
      },
      {
        title: "Themes",
        icon: Icons.PaintBrushIcon,
        url: "/superadmin/themes",
        items: [],
      },
    ],
  },
  {
    label: "TOOLS",
    items: [
      {
        title: "Search Tool",
        icon: Icons.MagnifyingGlassIcon,
        url: "/superadmin/search",
        items: [],
      },
      {
        title: "Database Browser",
        icon: Icons.CircleStackIcon,
        url: "/superadmin/database",
        items: [],
      },
      {
        title: "API Tester",
        icon: Icons.CodeBracketIcon,
        url: "/superadmin/api-tester",
        items: [],
      },
      {
        title: "Query Builder",
        icon: Icons.Cog6ToothIcon,
        url: "/superadmin/query-builder",
        items: [],
      },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      {
        title: "Settings",
        icon: Icons.Cog6ToothIcon,
        url: "/superadmin/settings",
        items: [],
      },
      {
        title: "Security",
        icon: Icons.ShieldCheckIcon,
        url: "/superadmin/security",
        items: [],
      },
      {
        title: "Audit Logs",
        icon: Icons.ClipboardDocumentListIcon,
        url: "/superadmin/audit-logs",
        items: [],
      },
      {
        title: "Admin Users",
        icon: Icons.UserIcon,
        url: "/superadmin/admin-users",
        items: [],
      },
    ],
  },
  {
    label: "HELP",
    items: [
      {
        title: "Documentation",
        icon: Icons.BookOpenIcon,
        url: "/superadmin/documentation",
        items: [],
      },
      {
        title: "Support",
        icon: Icons.QuestionMarkCircleIcon,
        url: "/superadmin/support",
        items: [],
      },
    ],
  },
];