"use client";

import { BookOpenIcon, LinkIcon, PlayIcon, CodeBracketIcon, CommandLineIcon } from "@heroicons/react/24/outline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DocSection {
  title: string;
  description: string;
  icon: any;
  links: { title: string; description: string; href: string }[];
}

export default function DocumentationPage() {
  const docSections: DocSection[] = [
    {
      title: "Getting Started",
      description: "Learn the basics of the super admin portal",
      icon: PlayIcon,
      links: [
        {
          title: "Introduction",
          description: "Overview of the super admin portal and its features",
          href: "#introduction",
        },
        {
          title: "Quick Start Guide",
          description: "Get up and running in minutes",
          href: "#quick-start",
        },
        {
          title: "User Management",
          description: "How to manage users and permissions",
          href: "#user-management",
        },
      ],
    },
    {
      title: "Tenant Management",
      description: "Managing tenants and their subscriptions",
      icon: CodeBracketIcon,
      links: [
        {
          title: "Creating Tenants",
          description: "How to create and configure new tenants",
          href: "#creating-tenants",
        },
        {
          title: "Subscription Plans",
          description: "Managing subscription plans and pricing",
          href: "#subscription-plans",
        },
        {
          title: "Billing & Invoices",
          description: "Handling billing and invoice management",
          href: "#billing",
        },
      ],
    },
    {
      title: "Security & Compliance",
      description: "Security best practices and compliance",
      icon: CommandLineIcon,
      links: [
        {
          title: "Security Settings",
          description: "Configure platform security policies",
          href: "#security-settings",
        },
        {
          title: "Audit Logs",
          description: "Monitoring and reviewing audit logs",
          href: "#audit-logs",
        },
        {
          title: "2FA Configuration",
          description: "Setting up two-factor authentication",
          href: "#2fa",
        },
      ],
    },
    {
      title: "Monitoring & Analytics",
      description: "Track platform performance and usage",
      icon: CommandLineIcon,
      links: [
        {
          title: "Dashboard Overview",
          description: "Understanding the admin dashboard",
          href: "#dashboard",
        },
        {
          title: "Analytics & Reports",
          description: "Generating reports and analyzing data",
          href: "#analytics",
        },
        {
          title: "System Health",
          description: "Monitoring system health and performance",
          href: "#system-health",
        },
      ],
    },
  ];

  const quickLinks = [
    { title: "API Documentation", href: "/api/docs", external: true },
    { title: "Release Notes", href: "/changelog", external: true },
    { title: "Support Portal", href: "/superadmin/support", external: false },
    { title: "Video Tutorials", href: "/tutorials", external: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documentation</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive guides and resources for managing the platform
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search documentation..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
            <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              Search
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <a
              key={link.title}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group"
            >
              <LinkIcon className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">{link.title}</span>
              {link.external && (
                <svg
                  className="h-4 w-4 text-gray-400 ml-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              )}
            </a>
          ))}
        </div>
      </div>

      {/* Documentation Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {docSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                    <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.links.map((link) => (
                    <a
                      key={link.title}
                      href={link.href}
                      className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {link.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {link.description}
                          </p>
                        </div>
                        <svg
                          className="h-4 w-4 text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need More Help?</CardTitle>
          <CardDescription>Can&apos;t find what you&apos;re looking for?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <a
              href="/superadmin/support"
              className="flex-1 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
            >
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Contact Support</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get help from our support team
              </p>
            </a>
            <a
              href="mailto:support@azaire.com"
              className="flex-1 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Email Us</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">support@azaire.com</p>
            </a>
            <a
              href="/tutorials"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Watch Tutorials</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Video guides and walkthroughs
              </p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
