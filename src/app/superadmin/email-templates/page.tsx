"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnvelopeIcon, PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { superAdminAPI } from "@/lib/superadmin-api";
import { useToast } from "@/components/ui/toast";

interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  variables: Record<string, string> | null;
  isActive: boolean;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function EmailTemplatesPage() {
  const toast = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    loadTemplates();
  }, [selectedCategory]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response: any = await superAdminAPI.getEmailTemplates({
        category: selectedCategory !== "all" ? selectedCategory : undefined,
      });

      if (response.success) {
        setTemplates(response.data.templates);
        setStats(response.data.stats);
      } else {
        toast.error("Failed to load email templates");
      }
    } catch (error) {
      console.error("Error loading email templates:", error);
      toast.error("Failed to load email templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm("This will create default email templates. Continue?")) return;

    try {
      const response: any = await superAdminAPI.seedEmailTemplates();

      if (response.success) {
        toast.success(response.message || "Default templates seeded successfully");
        loadTemplates();
      } else {
        toast.error("Failed to seed email templates");
      }
    } catch (error) {
      console.error("Error seeding templates:", error);
      toast.error("Failed to seed email templates");
    }
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    try {
      const response: any = await superAdminAPI.saveEmailTemplate({
        ...template,
        isActive: !template.isActive,
      });

      if (response.success) {
        toast.success(`Template ${template.isActive ? "deactivated" : "activated"} successfully`);
        loadTemplates();
      } else {
        toast.error("Failed to update template");
      }
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Failed to update template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response: any = await superAdminAPI.deleteEmailTemplate(templateId);

      if (response.success) {
        toast.success("Template deleted successfully");
        loadTemplates();
      } else {
        toast.error("Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Templates</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage system email templates</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSeedDefaults} variant="outline">
            Seed Defaults
          </Button>
          <Button onClick={() => toast.info("Template editor coming soon")}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Templates</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
              </div>
              <EnvelopeIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.active}</p>
              </div>
              <EnvelopeIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.inactive}</p>
              </div>
              <EnvelopeIcon className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "USER", "AUTHENTICATION", "BILLING", "SUBSCRIPTION", "OTHER"].map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {category === "all" ? "All" : category}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{template.subject}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</p>
                <Badge variant="outline">{template.category}</Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Variables:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {template.variables && Object.keys(template.variables).length > 0 ? (
                    Object.keys(template.variables).map((variable) => (
                      <span
                        key={variable}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        title={template.variables?.[variable]}
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">No variables</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button
                  onClick={() => toast.info("Template editor coming soon")}
                  variant="outline"
                  className="flex-1"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleToggleActive(template)}
                  variant="outline"
                  className="flex-1"
                >
                  {template.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  onClick={() => handleDeleteTemplate(template.id)}
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by seeding default templates
          </p>
          <div className="mt-6">
            <Button onClick={handleSeedDefaults}>Seed Default Templates</Button>
          </div>
        </div>
      )}
    </div>
  );
}
