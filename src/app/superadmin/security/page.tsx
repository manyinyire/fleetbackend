"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheckIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { superAdminAPI } from "@/lib/superadmin-api";
import { useToast } from "@/components/ui/toast";

interface SecuritySettings {
  require2FA: boolean;
  sessionTimeout: number;
  maxConcurrentSessions: number;
  ipWhitelist: string[];
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  accountLockoutThreshold: number;
  accountLockoutDuration: number;
  allowedDomains: string[];
  maintenance: {
    enabled: boolean;
    message: string;
    allowedIPs: string[];
  };
}

interface SecurityStats {
  failedLogins24h: number;
  failedLogins7d: number;
  activeSessions: number;
  bannedUsers: number;
}

export default function SecurityPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [newIP, setNewIP] = useState("");
  const [newDomain, setNewDomain] = useState("");

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      setLoading(true);
      const response: any = await superAdminAPI.getSecuritySettings();

      if (response.success) {
        setSettings(response.data.settings);
        setStats(response.data.statistics);
        setRecentEvents(response.data.recentEvents || []);
      } else {
        toast.error("Failed to load security settings");
      }
    } catch (error) {
      console.error("Error loading security settings:", error);
      toast.error("Failed to load security settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response: any = await superAdminAPI.updateSecuritySettings(settings);

      if (response.success) {
        toast.success("Security settings updated successfully");
        loadSecuritySettings();
      } else {
        toast.error(response.error || "Failed to update security settings");
      }
    } catch (error) {
      console.error("Error saving security settings:", error);
      toast.error("Failed to update security settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddIP = () => {
    if (!settings || !newIP) return;

    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(newIP)) {
      toast.error("Invalid IP address format");
      return;
    }

    if (settings.ipWhitelist.includes(newIP)) {
      toast.warning("IP address already in whitelist");
      return;
    }

    setSettings({
      ...settings,
      ipWhitelist: [...settings.ipWhitelist, newIP],
    });
    setNewIP("");
  };

  const handleRemoveIP = (ip: string) => {
    if (!settings) return;

    setSettings({
      ...settings,
      ipWhitelist: settings.ipWhitelist.filter((i) => i !== ip),
    });
  };

  const handleAddDomain = () => {
    if (!settings || !newDomain) return;

    if (settings.allowedDomains.includes(newDomain)) {
      toast.warning("Domain already in allowed list");
      return;
    }

    setSettings({
      ...settings,
      allowedDomains: [...settings.allowedDomains, newDomain],
    });
    setNewDomain("");
  };

  const handleRemoveDomain = (domain: string) => {
    if (!settings) return;

    setSettings({
      ...settings,
      allowedDomains: settings.allowedDomains.filter((d) => d !== domain),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!settings || !stats) {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Failed to load security settings</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure platform-wide security policies and monitor security events
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Logins (24h)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.failedLogins24h}</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.activeSessions}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Banned Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.bannedUsers}</p>
              </div>
              <XCircleIcon className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Logins (7d)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.failedLogins7d}</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authentication Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Configure authentication and session policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="require2FA">Require 2FA for All Users</Label>
              <input
                type="checkbox"
                id="require2FA"
                checked={settings.require2FA}
                onChange={(e) => setSettings({ ...settings, require2FA: e.target.checked })}
                className="h-4 w-4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                type="number"
                id="sessionTimeout"
                value={settings.sessionTimeout / 60000}
                onChange={(e) =>
                  setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) * 60000 })
                }
                min="5"
                max="1440"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxSessions">Max Concurrent Sessions</Label>
              <Input
                type="number"
                id="maxSessions"
                value={settings.maxConcurrentSessions}
                onChange={(e) =>
                  setSettings({ ...settings, maxConcurrentSessions: parseInt(e.target.value) })
                }
                min="1"
                max="10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Password Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Password Requirements</CardTitle>
            <CardDescription>Set password strength requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="minLength">Minimum Length</Label>
              <Input
                type="number"
                id="minLength"
                value={settings.passwordMinLength}
                onChange={(e) =>
                  setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) })
                }
                min="6"
                max="32"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Require Uppercase Letters</Label>
                <input
                  type="checkbox"
                  checked={settings.passwordRequireUppercase}
                  onChange={(e) =>
                    setSettings({ ...settings, passwordRequireUppercase: e.target.checked })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Require Lowercase Letters</Label>
                <input
                  type="checkbox"
                  checked={settings.passwordRequireLowercase}
                  onChange={(e) =>
                    setSettings({ ...settings, passwordRequireLowercase: e.target.checked })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Require Numbers</Label>
                <input
                  type="checkbox"
                  checked={settings.passwordRequireNumbers}
                  onChange={(e) =>
                    setSettings({ ...settings, passwordRequireNumbers: e.target.checked })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Require Special Characters</Label>
                <input
                  type="checkbox"
                  checked={settings.passwordRequireSpecialChars}
                  onChange={(e) =>
                    setSettings({ ...settings, passwordRequireSpecialChars: e.target.checked })
                  }
                  className="h-4 w-4"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Lockout */}
        <Card>
          <CardHeader>
            <CardTitle>Account Lockout</CardTitle>
            <CardDescription>Configure account lockout policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lockoutThreshold">Failed Login Attempts Before Lockout</Label>
              <Input
                type="number"
                id="lockoutThreshold"
                value={settings.accountLockoutThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, accountLockoutThreshold: parseInt(e.target.value) })
                }
                min="3"
                max="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
              <Input
                type="number"
                id="lockoutDuration"
                value={settings.accountLockoutDuration / 60000}
                onChange={(e) =>
                  setSettings({ ...settings, accountLockoutDuration: parseInt(e.target.value) * 60000 })
                }
                min="5"
                max="120"
              />
            </div>
          </CardContent>
        </Card>

        {/* IP Whitelist */}
        <Card>
          <CardHeader>
            <CardTitle>IP Whitelist</CardTitle>
            <CardDescription>Restrict super admin access to specific IPs (optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter IP address (e.g., 192.168.1.1)"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
              />
              <Button onClick={handleAddIP}>Add</Button>
            </div>

            <div className="space-y-2">
              {settings.ipWhitelist.length === 0 ? (
                <p className="text-sm text-gray-500">No IP restrictions (all IPs allowed)</p>
              ) : (
                settings.ipWhitelist.map((ip) => (
                  <div key={ip} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm">{ip}</span>
                    <button
                      onClick={() => handleRemoveIP(ip)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events (Last 24 Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-gray-500">No recent security events</p>
          ) : (
            <div className="space-y-2">
              {recentEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{event.action.replace(/_/g, " ")}</p>
                    <p className="text-xs text-gray-500">
                      {event.user?.name || "Unknown"} - {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={event.severity === "HIGH" || event.severity === "CRITICAL" ? "destructive" : "default"}>
                    {event.severity || "INFO"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
