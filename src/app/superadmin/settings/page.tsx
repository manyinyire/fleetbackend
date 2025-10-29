"use client";

import { useState } from "react";
import { 
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  DatabaseIcon,
  CloudIcon,
  CheckIcon
} from "@heroicons/react/24/outline";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", name: "General", icon: Cog6ToothIcon },
    { id: "security", name: "Security", icon: ShieldCheckIcon },
    { id: "notifications", name: "Notifications", icon: BellIcon },
    { id: "integrations", name: "Integrations", icon: GlobeAltIcon },
    { id: "database", name: "Database", icon: DatabaseIcon },
    { id: "cloud", name: "Cloud", icon: CloudIcon }
  ];

  const settings = {
    general: [
      {
        title: "Platform Name",
        description: "The name displayed across the platform",
        value: "Azaire Fleet Manager",
        type: "text"
      },
      {
        title: "Platform URL",
        description: "The main URL for the platform",
        value: "https://azaire.com",
        type: "text"
      },
      {
        title: "Default Timezone",
        description: "Default timezone for all tenants",
        value: "Africa/Harare",
        type: "select",
        options: ["Africa/Harare", "UTC", "America/New_York", "Europe/London"]
      },
      {
        title: "Maintenance Mode",
        description: "Enable maintenance mode to restrict access",
        value: false,
        type: "toggle"
      }
    ],
    security: [
      {
        title: "Force 2FA",
        description: "Require two-factor authentication for all admin users",
        value: true,
        type: "toggle"
      },
      {
        title: "Session Timeout",
        description: "Automatic logout after inactivity (minutes)",
        value: 30,
        type: "number"
      },
      {
        title: "IP Whitelist",
        description: "Restrict admin access to specific IP addresses",
        value: false,
        type: "toggle"
      },
      {
        title: "Failed Login Attempts",
        description: "Lock account after failed login attempts",
        value: 5,
        type: "number"
      }
    ],
    notifications: [
      {
        title: "Email Notifications",
        description: "Send email notifications for system alerts",
        value: true,
        type: "toggle"
      },
      {
        title: "SMS Notifications",
        description: "Send SMS notifications for critical alerts",
        value: false,
        type: "toggle"
      },
      {
        title: "Webhook URL",
        description: "Send alerts to external webhook",
        value: "",
        type: "text"
      },
      {
        title: "Alert Frequency",
        description: "How often to send repeated alerts",
        value: "immediate",
        type: "select",
        options: ["immediate", "hourly", "daily"]
      }
    ]
  };

  const renderSetting = (setting: any) => {
    switch (setting.type) {
      case "text":
        return (
          <input
            type="text"
            value={setting.value}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        );
      case "number":
        return (
          <input
            type="number"
            value={setting.value}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        );
      case "select":
        return (
          <select
            value={setting.value}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            {setting.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      case "toggle":
        return (
          <button
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              setting.value ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                setting.value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure platform settings and preferences
          </p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
          Save Changes
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md transition-colors ${
                    activeTab === tab.id
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {tabs.find(tab => tab.id === activeTab)?.name} Settings
              </h2>
            </div>
            
            <div className="p-6">
              {activeTab === "general" && (
                <div className="space-y-6">
                  {settings.general.map((setting, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {setting.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {setting.description}
                        </p>
                      </div>
                      <div className="ml-6 w-64">
                        {renderSetting(setting)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  {settings.security.map((setting, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {setting.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {setting.description}
                        </p>
                      </div>
                      <div className="ml-6 w-64">
                        {renderSetting(setting)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-6">
                  {settings.notifications.map((setting, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {setting.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {setting.description}
                        </p>
                      </div>
                      <div className="ml-6 w-64">
                        {renderSetting(setting)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "integrations" && (
                <div className="text-center py-12">
                  <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No integrations configured
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Set up third-party integrations and APIs.
                  </p>
                  <div className="mt-6">
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
                      Add Integration
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "database" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Database Status
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Connected to primary database
                      </p>
                      <div className="mt-2 flex items-center text-green-600 dark:text-green-400">
                        <CheckIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm">Healthy</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Last Backup
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        2 hours ago
                      </p>
                      <div className="mt-2">
                        <button className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                          Create Backup
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "cloud" && (
                <div className="text-center py-12">
                  <CloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    Cloud services not configured
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Set up cloud storage and CDN services.
                  </p>
                  <div className="mt-6">
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
                      Configure Cloud
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}