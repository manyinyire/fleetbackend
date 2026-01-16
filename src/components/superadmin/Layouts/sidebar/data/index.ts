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
        title: "Plans",
        icon: Icons.RectangleStackIcon,
        url: "/superadmin/plans",
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
    label: "PLATFORM",
    items: [
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
        title: "Support",
        icon: Icons.QuestionMarkCircleIcon,
        url: "/superadmin/support",
        items: [],
      },
    ],
  },
];