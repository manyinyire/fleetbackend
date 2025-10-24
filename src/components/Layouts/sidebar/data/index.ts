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
    ],
  },
  {
    label: "SYSTEM",
    items: [
      {
        title: "Settings",
        icon: Icons.Settings,
        url: "/settings",
        items: [],
      },
      {
        title: "Profile",
        icon: Icons.User,
        url: "/profile",
        items: [],
      },
    ],
  },
];
