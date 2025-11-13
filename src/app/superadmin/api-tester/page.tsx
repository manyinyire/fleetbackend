"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  CodeBracketIcon,
  PlayIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  BeakerIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

export default function APITesterPage() {
  const plannedFeatures = [
    {
      icon: PlayIcon,
      title: "Test Endpoints",
      description: "Send requests to any API endpoint with custom headers and body",
    },
    {
      icon: ClockIcon,
      title: "Request History",
      description: "View and replay previous API requests",
    },
    {
      icon: DocumentDuplicateIcon,
      title: "Collections",
      description: "Organize and save requests into collections",
    },
    {
      icon: BeakerIcon,
      title: "Environment Variables",
      description: "Manage variables for different environments",
    },
    {
      icon: ChartBarIcon,
      title: "Response Analysis",
      description: "Analyze response times, status codes, and payloads",
    },
    {
      icon: CodeBracketIcon,
      title: "Code Generation",
      description: "Generate code snippets in multiple languages",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Tester</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test and debug API endpoints directly from the admin panel
        </p>
      </div>

      {/* Coming Soon Banner */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CodeBracketIcon className="mx-auto h-16 w-16 text-green-600 dark:text-green-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              API Tester Coming Soon
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We're building an integrated API testing tool similar to Postman, but built right into your
              admin panel. Test endpoints, save collections, and debug issues without leaving the platform.
            </p>
            <div className="mt-6">
              <span className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg">
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
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <div className="flex items-center gap-2 mb-3">
                <select className="bg-gray-800 text-green-400 px-3 py-1 rounded">
                  <option>GET</option>
                </select>
                <input
                  type="text"
                  value="https://api.example.com/users"
                  readOnly
                  className="flex-1 bg-gray-800 text-gray-300 px-3 py-1 rounded"
                />
                <button className="bg-green-600 text-white px-4 py-1 rounded">Send</button>
              </div>
              <div className="border-t border-gray-800 pt-3">
                <div className="text-gray-500 mb-2">Response</div>
                <div className="text-green-400">
                  {`{
  "status": 200,
  "message": "Success",
  "data": { ... }
}`}
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
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Icon className="h-6 w-6 text-green-600 dark:text-green-400" />
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
