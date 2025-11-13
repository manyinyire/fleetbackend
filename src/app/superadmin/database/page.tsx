"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  CircleStackIcon,
  TableCellsIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export default function DatabaseBrowserPage() {
  const plannedFeatures = [
    {
      icon: TableCellsIcon,
      title: "Browse Tables",
      description: "View and navigate through all database tables and schemas",
    },
    {
      icon: MagnifyingGlassIcon,
      title: "Advanced Search",
      description: "Search across tables with filters and query builders",
    },
    {
      icon: PencilSquareIcon,
      title: "Data Editing",
      description: "Safely edit records with validation and audit logging",
    },
    {
      icon: ArrowPathIcon,
      title: "Query History",
      description: "View and re-run previous queries and operations",
    },
    {
      icon: ShieldCheckIcon,
      title: "Role-Based Access",
      description: "Granular permissions for database operations",
    },
    {
      icon: CircleStackIcon,
      title: "Export & Backup",
      description: "Export data and create database backups",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Database Browser</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse, query, and manage database tables directly
        </p>
      </div>

      {/* Warning Banner */}
      <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Advanced Tool - Handle with Care
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The database browser provides direct access to your database. This powerful tool is being
                carefully developed with robust security measures, audit logging, and safeguards to prevent
                accidental data loss.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CircleStackIcon className="mx-auto h-16 w-16 text-blue-600 dark:text-blue-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Database Browser Coming Soon
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We're developing a secure and powerful database browser with comprehensive audit logging,
              role-based permissions, and safety features to help you manage your data with confidence.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg">
                In Development
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Expected: Q2 2025
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Planned Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plannedFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
