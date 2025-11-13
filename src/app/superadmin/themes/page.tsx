"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaintBrushIcon, SwatchIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/toast";

export default function ThemesPage() {
  const toast = useToast();
  const [settings, setSettings] = useState({
    primaryColor: "#047857",
    secondaryColor: "#F59E0B",
    accentColor: "#D97706",
    mode: "system",
    borderRadius: "medium",
    fontSize: "medium",
  });

  const handleSave = () => {
    toast.success("Theme settings saved successfully");
  };

  const colorPresets = [
    { name: "Forest & Amber", primary: "#047857", secondary: "#F59E0B", description: "Organic, grounded" },
    { name: "Ocean Depths", primary: "#0E7490", secondary: "#0891B2", description: "Deep, calm" },
    { name: "Sunset Coral", primary: "#DC2626", secondary: "#F97316", description: "Warm, energetic" },
    { name: "Midnight Slate", primary: "#334155", secondary: "#64748B", description: "Professional, modern" },
    { name: "Royal Berry", primary: "#7C2D12", secondary: "#BE123C", description: "Rich, bold" },
    { name: "Tropical Teal", primary: "#115E59", secondary: "#14B8A6", description: "Fresh, vibrant" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gradient-forest dark:text-white mb-1">
            Theme Customization
          </h1>
          <p className="text-sm sm:text-base text-dark-5 dark:text-dark-6 font-medium">
            Craft a distinctive aesthetic that reflects your brand
          </p>
        </div>
        <Button onClick={handleSave} className="hover-lift w-full sm:w-auto" size="lg">
          Save Changes
        </Button>
      </div>

      {/* Preview */}
      <Card className="overflow-hidden hover-lift animate-fade-in-scale" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="bg-geometric-pattern">
          <CardTitle className="font-display">Live Theme Preview</CardTitle>
          <CardDescription>See your palette come to life</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div
            className="p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 transition-all"
            style={{
              background: `linear-gradient(135deg, ${settings.primaryColor}18 0%, ${settings.secondaryColor}18 100%)`,
            }}
          >
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105 hover:shadow-lg"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  Primary Action
                </button>
                <button
                  className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105 hover:shadow-lg"
                  style={{ backgroundColor: settings.secondaryColor }}
                >
                  Secondary Action
                </button>
                <button
                  className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105 hover:shadow-lg"
                  style={{ backgroundColor: settings.accentColor }}
                >
                  Accent Action
                </button>
              </div>
              <div
                className="p-5 rounded-xl backdrop-blur-sm border border-opacity-20"
                style={{
                  backgroundColor: `${settings.primaryColor}25`,
                  borderColor: settings.primaryColor
                }}
              >
                <p className="text-sm font-medium leading-relaxed" style={{ color: settings.primaryColor }}>
                  Your brand colors create atmosphere and depth across every interface element
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
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
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
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
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Distinctive Color Palettes
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {colorPresets.map((preset, idx) => (
                  <button
                    key={preset.name}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        primaryColor: preset.primary,
                        secondaryColor: preset.secondary,
                      })
                    }
                    className="group relative flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-all hover:shadow-md"
                    style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
                  >
                    <div className="flex gap-1.5">
                      <div
                        className="w-8 h-8 rounded-lg shadow-sm group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div
                        className="w-8 h-8 rounded-lg shadow-sm group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: preset.secondary }}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {preset.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {preset.description}
                      </div>
                    </div>
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
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {mode}
                    </div>
                    {settings.mode === mode && (
                      <CheckCircleIcon className="h-4 w-4 text-primary dark:text-primary-light mx-auto mt-1" />
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
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
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
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
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
