"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  DocumentTextIcon,
  PencilSquareIcon,
  PhotoIcon,
  FolderIcon,
  Cog6ToothIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";

export default function ContentCMSPage() {
  const plannedFeatures = [
    {
      icon: DocumentTextIcon,
      title: "Page Management",
      description: "Create, edit, and manage static pages with a visual editor",
    },
    {
      icon: PencilSquareIcon,
      title: "Rich Text Editor",
      description: "WYSIWYG editor with markdown support and live preview",
    },
    {
      icon: PhotoIcon,
      title: "Media Library",
      description: "Upload and manage images, videos, and documents",
    },
    {
      icon: FolderIcon,
      title: "Content Organization",
      description: "Categories, tags, and hierarchical content structure",
    },
    {
      icon: Cog6ToothIcon,
      title: "SEO Optimization",
      description: "Meta tags, open graph, and schema markup management",
    },
    {
      icon: RocketLaunchIcon,
      title: "Publishing Workflow",
      description: "Draft, review, schedule, and publish content",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management System</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage pages, posts, and media across the platform
        </p>
      </div>

      {/* Coming Soon Banner */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <DocumentTextIcon className="mx-auto h-16 w-16 text-indigo-600 dark:text-indigo-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Content CMS Coming Soon
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We&apos;re building a powerful content management system to help you create and manage content
              across your platform. This feature will include page management, media library, SEO tools,
              and more.
            </p>
            <div className="mt-6">
              <span className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg">
                <RocketLaunchIcon className="h-5 w-5 mr-2" />
                In Development
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
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                      <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
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

      {/* Notification Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Get Notified When Available
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Want to be the first to know when Content CMS is ready? We&apos;ll send you an update.
              </p>
            </div>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors whitespace-nowrap">
              Notify Me
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
