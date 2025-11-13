"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Cog6ToothIcon,
  PuzzlePieceIcon,
  ArrowsRightLeftIcon,
  FunnelIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function QueryBuilderPage() {
  const plannedFeatures = [
    {
      icon: PuzzlePieceIcon,
      title: "Visual Builder",
      description: "Build queries visually without writing SQL",
    },
    {
      icon: FunnelIcon,
      title: "Advanced Filters",
      description: "Create complex filter conditions with AND/OR logic",
    },
    {
      icon: ArrowsRightLeftIcon,
      title: "Join Tables",
      description: "Visually create joins between related tables",
    },
    {
      icon: ChartBarIcon,
      title: "Aggregations",
      description: "Group, count, sum, and analyze data",
    },
    {
      icon: DocumentTextIcon,
      title: "Save Queries",
      description: "Save and reuse frequently used queries",
    },
    {
      icon: Cog6ToothIcon,
      title: "Export Results",
      description: "Export query results to CSV, JSON, or Excel",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Query Builder</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Build and execute database queries visually
        </p>
      </div>

      {/* Coming Soon Banner */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Cog6ToothIcon className="mx-auto h-16 w-16 text-purple-600 dark:text-purple-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Query Builder Coming Soon
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We're developing a powerful visual query builder that lets you create complex database queries
              without writing SQL. Build queries with drag-and-drop, save them for later, and export results
              in multiple formats.
            </p>
            <div className="mt-6">
              <span className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg">
                In Development
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mockup Preview */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Preview</h3>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                    Table:
                  </span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded px-3 py-2 text-sm">
                    users
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                    Fields:
                  </span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded px-3 py-2 text-sm">
                    id, name, email, role, createdAt
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                    Where:
                  </span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded px-3 py-2 text-sm">
                    role = 'SUPER_ADMIN' AND status = 'ACTIVE'
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                    Order:
                  </span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded px-3 py-2 text-sm">
                    createdAt DESC
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Generated SQL:
                </div>
                <div className="bg-gray-900 rounded p-3 font-mono text-xs text-green-400">
                  SELECT id, name, email, role, createdAt FROM users<br />
                  WHERE role = 'SUPER_ADMIN' AND status = 'ACTIVE'<br />
                  ORDER BY createdAt DESC;
                </div>
              </div>
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
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
