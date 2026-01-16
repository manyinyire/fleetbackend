import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "FLEET MANAGEMENT",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        url: "/dashboard",
        items: [],
      },
      {
        title: "Vehicles",
        icon: Icons.Car,
        url: "/vehicles",
        items: [],
      },
      {
        title: "Drivers",
        icon: Icons.User,
        url: "/drivers",
        items: [],
      },
      {
        title: "Remittances",
        icon: Icons.Dollar,
        url: "/remittances",
        items: [],
      },
      {
        title: "Maintenance",
        icon: Icons.Wrench,
        url: "/maintenance",
        items: [],
      },
      {
        title: "Finances",
        icon: Icons.PieChart,
        items: [
          {
            title: "Income & Expenses",
            url: "/finances/transactions",
          },
          {
            title: "Reports",
            url: "/finances/reports",
          },
        ],
      },
      {
        title: "Billing",
        icon: Icons.CurrencyDollarIcon,
        url: "/billing",
        items: [],
      },
    ],
  },
];

export const SUPER_ADMIN_NAV_DATA = [
  {
    label: "SYSTEM ADMINISTRATION",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        url: "/admin/dashboard",
        items: [],
      },
      {
        title: "Tenants",
        icon: Icons.User,
        url: "/admin/tenants",
        items: [],
      },
      {
        title: "Users",
        icon: Icons.User,
        url: "/admin/users",
        items: [],
      },
      {
        title: "System Settings",
        icon: Icons.Settings,
        url: "/admin/settings",
        items: [],
      },
    ],
  },
  {
    label: "FINANCIAL",
    items: [
      {
        title: "Revenue Dashboard",
        icon: Icons.CurrencyDollarIcon,
        url: "/admin/revenue",
        items: [],
      },
      {
        title: "Invoices & Payments",
        icon: Icons.CurrencyDollarIcon,
        url: "/admin/invoices",
        items: [],
      },
      {
        title: "Subscription Analytics",
        icon: Icons.ChartBarIcon,
        url: "/admin/subscriptions",
        items: [],
      },
    ],
  },
  {
    label: "CONTENT & COMMUNICATION",
    items: [
      {
        title: "Email Templates",
        icon: Icons.EnvelopeIcon,
        url: "/admin/email-templates",
        items: [],
      },
      {
        title: "Notifications",
        icon: Icons.BellIcon,
        url: "/admin/notifications",
        items: [],
      },
      {
        title: "Feature Flags",
        icon: Icons.FlagIcon,
        url: "/admin/feature-flags",
        items: [],
      },
    ],
  },
  {
    label: "ANALYTICS & REPORTS",
    items: [
      {
        title: "Analytics Dashboard",
        icon: Icons.ChartBarIcon,
        url: "/admin/analytics",
        items: [],
      },
      {
        title: "Custom Reports",
        icon: Icons.DocumentTextIcon,
        url: "/admin/report-builder",
        items: [],
      },
      {
        title: "Data Export",
        icon: Icons.ArrowDownTrayIcon,
        url: "/admin/export",
        items: [],
      },
    ],
  },
  {
    label: "SECURITY & COMPLIANCE",
    items: [
      {
        title: "Audit Logs",
        icon: Icons.DocumentTextIcon,
        url: "/admin/audit-logs",
        items: [],
      },
      {
        title: "Security Center",
        icon: Icons.ShieldCheckIcon,
        url: "/admin/security",
        items: [],
      },
      {
        title: "Compliance",
        icon: Icons.CheckBadgeIcon,
        url: "/admin/compliance",
        items: [],
      },
    ],
  },
];