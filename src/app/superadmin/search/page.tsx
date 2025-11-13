"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MagnifyingGlassIcon, UserIcon, BuildingOfficeIcon, TruckIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { superAdminAPI } from "@/lib/superadmin-api";
import { useToast } from "@/components/ui/toast";

export default function SearchToolPage() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (query.length < 2) {
      toast.warning("Please enter at least 2 characters");
      return;
    }

    try {
      setLoading(true);
      const response: any = await superAdminAPI.search(query, type, 10);

      if (response.success) {
        setResults(response.data);
      } else {
        toast.error("Search failed");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "users":
        return UserIcon;
      case "tenants":
        return BuildingOfficeIcon;
      case "vehicles":
        return TruckIcon;
      default:
        return DocumentTextIcon;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Global Search</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Search across all platform entities
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users, tenants, vehicles, and more..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-lg"
                />
              </div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="users">Users</option>
                <option value="tenants">Tenants</option>
                <option value="vehicles">Vehicles</option>
                <option value="drivers">Drivers</option>
                <option value="invoices">Invoices</option>
                <option value="auditLogs">Audit Logs</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {results.totalResults} {results.totalResults === 1 ? "result" : "results"} for "{results.query}"
            </h2>
          </div>

          {Object.entries(results.results).map(([category, items]: [string, any]) => {
            if (!items || items.length === 0) return null;

            const Icon = getIcon(category);

            return (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-2 flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {category} ({items.length})
                </h3>
                <div className="space-y-2">
                  {items.map((item: any) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {item.name || item.fullName || item.registrationNumber || item.invoiceNumber || item.action || "Unnamed"}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {item.email || item.phone || item.model || item.entityType || ""}
                            </p>
                            {item.tenant && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Tenant: {item.tenant.name}
                              </p>
                            )}
                          </div>
                          <a
                            href={`/superadmin/${category}/${item.id}`}
                            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 text-sm font-medium"
                          >
                            View →
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {results.totalResults === 0 && (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No results found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search query or filter type
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Tips */}
      {!results && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Search Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">•</span>
                <span>Use at least 2 characters for your search query</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">•</span>
                <span>Search by name, email, phone, or registration number</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">•</span>
                <span>Use filters to narrow down results to specific entity types</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">•</span>
                <span>Click on results to view detailed information</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
