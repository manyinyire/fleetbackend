"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  QuestionMarkCircleIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  LifebuoyIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/toast";

export default function SupportPage() {
  const toast = useToast();
  const [formData, setFormData] = useState({
    subject: "",
    category: "technical",
    priority: "medium",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Here you would typically send the support request to an API
    toast.success("Support request submitted successfully. We'll get back to you soon!");
    setFormData({ subject: "", category: "technical", priority: "medium", message: "" });
  };

  const supportOptions = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      action: "Start Chat",
      color: "indigo",
      available: false,
    },
    {
      icon: EnvelopeIcon,
      title: "Email Support",
      description: "Send us an email and we'll respond within 24 hours",
      action: "support@azaire.com",
      color: "blue",
      available: true,
    },
    {
      icon: BookOpenIcon,
      title: "Documentation",
      description: "Browse our comprehensive documentation",
      action: "View Docs",
      color: "purple",
      available: true,
      href: "/superadmin/documentation",
    },
    {
      icon: QuestionMarkCircleIcon,
      title: "FAQ",
      description: "Find answers to commonly asked questions",
      action: "Browse FAQ",
      color: "green",
      available: true,
    },
  ];

  const faqItems = [
    {
      question: "How do I create a new tenant?",
      answer:
        "Navigate to the Tenants page and click 'Add New Tenant'. Fill in the required information including name, email, and plan selection.",
    },
    {
      question: "How can I change a user's role?",
      answer:
        "Go to the Users page, find the user, and click the edit icon next to their role. Select the new role from the dropdown and confirm the change.",
    },
    {
      question: "What's the difference between banning and suspending a user?",
      answer:
        "Banning is a temporary or permanent restriction with a specific reason and optional expiration. Suspending typically refers to deactivating a tenant or subscription.",
    },
    {
      question: "How do I monitor system performance?",
      answer:
        "Use the System Health page to view real-time performance metrics, server status, and service health. The Performance page provides detailed analytics.",
    },
    {
      question: "Can I customize email templates?",
      answer:
        "Yes! Visit the Email Templates page to view, edit, and manage all system email templates. You can also create custom templates for specific use cases.",
    },
    {
      question: "How do I handle failed payments?",
      answer:
        "Navigate to the Invoices page and use the 'Retry Payment' action for failed invoices. The system will attempt to process the payment again with the stored payment method.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Center</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Get help, report issues, or ask questions about the platform
        </p>
      </div>

      {/* Support Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {supportOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Card key={option.title} className={option.available ? "" : "opacity-60"}>
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className={`inline-flex p-3 rounded-full bg-${option.color}-100 dark:bg-${option.color}-900/20`}>
                    <Icon className={`h-6 w-6 text-${option.color}-600 dark:text-${option.color}-400`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{option.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {option.description}
                    </p>
                  </div>
                  {option.available ? (
                    option.href ? (
                      <a
                        href={option.href}
                        className="inline-block text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                      >
                        {option.action}
                      </a>
                    ) : (
                      <button className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium">
                        {option.action}
                      </button>
                    )
                  ) : (
                    <span className="text-sm text-gray-400">Coming Soon</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submit Support Request */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Submit a Support Request</CardTitle>
            <CardDescription>Describe your issue and we'll help you resolve it</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing Question</option>
                    <option value="feature">Feature Request</option>
                    <option value="account">Account Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  rows={6}
                  placeholder="Please provide as much detail as possible..."
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  * Required fields
                </p>
                <Button type="submit">Submit Request</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* System Status & Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">All Systems</span>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Operational</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">API</span>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Operational</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Operational</span>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <a
                  href="/superadmin/system-health"
                  className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  View detailed status →
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Email Support</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    &lt; 24 hours
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Urgent Issues</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    &lt; 4 hours
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Critical</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    &lt; 1 hour
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="group p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <summary className="cursor-pointer flex items-center justify-between font-medium text-gray-900 dark:text-white">
                  {item.question}
                  <svg
                    className="h-5 w-5 text-gray-500 transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{item.answer}</p>
              </details>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
