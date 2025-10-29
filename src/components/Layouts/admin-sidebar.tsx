'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ServerIcon,
  ChartPieIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  BellIcon,
  PaintBrushIcon,
  MagnifyingGlassIcon,
  CircleStackIcon,
  BeakerIcon,
  TableCellsIcon,
  Cog6ToothIcon,
  LockClosedIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  BookOpenIcon,
  LifebuoyIcon,
  BanknotesIcon,
  ReceiptRefundIcon
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AdminSidebar() {
  const pathname = usePathname();

  const navigation: NavSection[] = [
    {
      title: '',
      items: [
        { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon }
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { name: 'Tenants', href: '/admin/tenants', icon: BuildingOfficeIcon },
        { name: 'Users', href: '/admin/users', icon: UsersIcon },
        { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCardIcon },
        { name: 'Billing', href: '/admin/revenue', icon: CurrencyDollarIcon }
      ]
    },
    {
      title: 'PAYMENTS',
      items: [
        { name: 'Payments', href: '/admin/payments', icon: BanknotesIcon },
        { name: 'Reconciliation', href: '/admin/reconciliation', icon: ReceiptRefundIcon }
      ]
    },
    {
      title: 'MONITORING',
      items: [
        { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
        { name: 'System Health', href: '/admin/system-health', icon: ServerIcon },
        { name: 'Performance', href: '/admin/performance', icon: ChartPieIcon },
        { name: 'Error Logs', href: '/admin/error-logs', icon: ExclamationTriangleIcon }
      ]
    },
    {
      title: 'PLATFORM',
      items: [
        { name: 'Content (CMS)', href: '/admin/content', icon: DocumentTextIcon },
        { name: 'Email Templates', href: '/admin/email-templates', icon: EnvelopeIcon },
        { name: 'Notifications', href: '/admin/notifications', icon: BellIcon },
        { name: 'Themes', href: '/admin/themes', icon: PaintBrushIcon }
      ]
    },
    {
      title: 'TOOLS',
      items: [
        { name: 'Search Tool', href: '/admin/search', icon: MagnifyingGlassIcon },
        { name: 'Database Browser', href: '/admin/database', icon: CircleStackIcon },
        { name: 'API Tester', href: '/admin/api-tester', icon: BeakerIcon },
        { name: 'Query Builder', href: '/admin/report-builder', icon: TableCellsIcon }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
        { name: 'Security', href: '/admin/security', icon: LockClosedIcon },
        { name: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardDocumentListIcon },
        { name: 'Admin Users', href: '/admin/admin-users', icon: UserGroupIcon }
      ]
    },
    {
      title: 'HELP',
      items: [
        { name: 'Documentation', href: '/admin/docs', icon: BookOpenIcon },
        { name: 'Support', href: '/admin/support', icon: LifebuoyIcon }
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
        <Link href="/admin/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            Azaire Admin
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-6">
            {section.title && (
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${
                        active
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <Icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
                          active
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400'
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>🔒 Enhanced security with 2FA</p>
          <p>🌐 IP whitelist protection</p>
          <p>⏰ Session timeout: 30 minutes</p>
          <p>📊 All actions logged and audited</p>
        </div>
      </div>
    </aside>
  );
}
