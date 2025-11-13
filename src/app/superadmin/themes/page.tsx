"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaintBrushIcon, SwatchIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/toast";

export default function ThemesPage() {
  const toast = useToast();
  const [settings, setSettings] = useState({
    primaryColor: "#4F46E5",
    secondaryColor: "#9333EA",
    accentColor: "#06B6D4",
    mode: "system",
    borderRadius: "medium",
    fontSize: "medium",
  });

  const handleSave = () => {
    toast.success("Theme settings saved successfully");
  };

  const colorPresets = [
    { name: "Indigo", primary: "#4F46E5", secondary: "#9333EA" },
    { name: "Blue", primary: "#2563EB", secondary: "#0EA5E9" },
    { name: "Purple", primary: "#9333EA", secondary: "#C026D3" },
    { name: "Green", primary: "#16A34A", secondary: "#0D9488" },
    { name: "Orange", primary: "#EA580C", secondary: "#F97316" },
    { name: "Red", primary: "#DC2626", secondary: "#EF4444" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Theme Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize the look and feel of the admin portal
          </p>
        </div>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Preview</CardTitle>
          <CardDescription>See how your theme looks in action</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700"
            style={{
              background: `linear-gradient(135deg, ${settings.primaryColor}15 0%, ${settings.secondaryColor}15 100%)`,
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <button
                  className="px-4 py-2 rounded text-white transition-colors"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  Primary Button
                </button>
                <button
                  className="px-4 py-2 rounded text-white transition-colors"
                  style={{ backgroundColor: settings.secondaryColor }}
                >
                  Secondary Button
                </button>
                <button
                  className="px-4 py-2 rounded text-white transition-colors"
                  style={{ backgroundColor: settings.accentColor }}
                >
                  Accent Button
                </button>
              </div>
              <div
                className="p-4 rounded"
                style={{ backgroundColor: `${settings.primaryColor}20` }}
              >
                <p className="text-sm" style={{ color: settings.primaryColor }}>
                  This is an example of a colored section with your primary color
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Colors</CardTitle>
            <CardDescription>Customize your color scheme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.secondaryColor}
                  onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.accentColor}
                  onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Color Presets
              </label>
              <div className="grid grid-cols-3 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        primaryColor: preset.primary,
                        secondaryColor: preset.secondary,
                      })
                    }
                    className="flex items-center gap-2 p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors"
                  >
                    <div className="flex gap-1">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: preset.secondary }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Adjust the visual style</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["light", "dark", "system"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSettings({ ...settings, mode })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      settings.mode === mode
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {mode}
                    </div>
                    {settings.mode === mode && (
                      <CheckCircleIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mx-auto mt-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Border Radius
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "small", label: "Small", px: "4px" },
                  { value: "medium", label: "Medium", px: "8px" },
                  { value: "large", label: "Large", px: "12px" },
                ].map((radius) => (
                  <button
                    key={radius.value}
                    onClick={() => setSettings({ ...settings, borderRadius: radius.value })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      settings.borderRadius === radius.value
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {radius.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {radius.px}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Font Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "small", label: "Small", px: "14px" },
                  { value: "medium", label: "Medium", px: "16px" },
                  { value: "large", label: "Large", px: "18px" },
                ].map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setSettings({ ...settings, fontSize: size.value })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      settings.fontSize === size.value
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {size.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{size.px}</div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Settings (Coming Soon) */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Customization</CardTitle>
          <CardDescription>More customization options coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <SwatchIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Advanced Features Coming Soon
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Custom CSS, logo upload, and more customization options are in development
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
