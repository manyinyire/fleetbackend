"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Settings, DollarSign, Users, TrendingUp, Check, X, Plus, Trash2, RefreshCw } from "lucide-react";

interface PlanConfig {
  plan: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  limits: {
    maxVehicles: number;
    maxUsers: number;
    maxDrivers: number;
    [key: string]: any;
  };
  isActive: boolean;
  sortOrder: number;
}

export default function PlansConfigurationPage() {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/superadmin/plans");
      const data = await response.json();

      if (data.success) {
        setPlans(data.plans);
      } else {
        setMessage({ type: 'error', text: 'Failed to load plans' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading plans' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: PlanConfig) => {
    setEditingPlan({ ...plan });
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!editingPlan) return;

    try {
      setSaving(true);
      const response = await fetch("/api/superadmin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPlan),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Plan configuration saved successfully' });
        setShowEditDialog(false);
        setEditingPlan(null);
        fetchPlans();
      } else {
        setMessage({ type: 'error', text: 'Failed to save plan configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving plan configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm("This will reset all plan configurations to defaults. Continue?")) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/superadmin/plans", {
        method: "PUT",
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Plans seeded with default configurations' });
        fetchPlans();
      } else {
        setMessage({ type: 'error', text: 'Failed to seed plans' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error seeding plans' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddFeature = () => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, ""],
    });
  };

  const handleRemoveFeature = (index: number) => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, i) => i !== index),
    });
  };

  const handleFeatureChange = (index: number, value: string) => {
    if (!editingPlan) return;
    const newFeatures = [...editingPlan.features];
    newFeatures[index] = value;
    setEditingPlan({
      ...editingPlan,
      features: newFeatures,
    });
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return <Users className="h-5 w-5" />;
      case 'BASIC':
        return <TrendingUp className="h-5 w-5" />;
      case 'PREMIUM':
        return <DollarSign className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return 'bg-blue-500';
      case 'BASIC':
        return 'bg-green-500';
      case 'PREMIUM':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Plan Configuration</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage subscription plan pricing, features, and limits
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchPlans}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleSeedDefaults}
            variant="outline"
            disabled={saving}
          >
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.plan} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${getPlanColor(plan.plan)} bg-opacity-10`}>
                  {getPlanIcon(plan.plan)}
                </div>
                <Badge variant={plan.isActive ? "default" : "secondary"}>
                  {plan.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardTitle className="mt-4">{plan.displayName}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly</span>
                  <span className="text-2xl font-bold">
                    ${plan.monthlyPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Yearly</span>
                  <span className="text-lg font-semibold">
                    ${plan.yearlyPrice.toFixed(2)}
                  </span>
                </div>
                {plan.yearlyPrice > 0 && (
                  <div className="text-xs text-green-600">
                    Save {Math.round((1 - (plan.yearlyPrice / 12) / plan.monthlyPrice) * 100)}% annually
                  </div>
                )}
              </div>

              {/* Limits */}
              <div className="border-t pt-4 space-y-2">
                <h4 className="font-semibold text-sm">Limits</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicles</span>
                    <span className="font-medium">
                      {plan.limits.maxVehicles === -1 ? "Unlimited" : plan.limits.maxVehicles}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Users</span>
                    <span className="font-medium">
                      {plan.limits.maxUsers === -1 ? "Unlimited" : plan.limits.maxUsers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Drivers</span>
                    <span className="font-medium">
                      {plan.limits.maxDrivers === -1 ? "Unlimited" : plan.limits.maxDrivers}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="border-t pt-4 space-y-2">
                <h4 className="font-semibold text-sm">Features</h4>
                <ul className="space-y-1 text-sm">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-gray-500">+{plan.features.length - 3} more...</li>
                  )}
                </ul>
              </div>

              <Button
                onClick={() => handleEdit(plan)}
                className="w-full mt-4"
                variant="outline"
              >
                Edit Configuration
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editingPlan?.displayName}</DialogTitle>
            <DialogDescription>
              Update plan configuration, pricing, features, and limits
            </DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={editingPlan.displayName}
                    onChange={(e) => setEditingPlan({ ...editingPlan, displayName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plan Type</Label>
                  <Input value={editingPlan.plan} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Pricing */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyPrice">Monthly Price ($)</Label>
                    <Input
                      id="monthlyPrice"
                      type="number"
                      step="0.01"
                      value={editingPlan.monthlyPrice}
                      onChange={(e) => setEditingPlan({ ...editingPlan, monthlyPrice: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearlyPrice">Yearly Price ($)</Label>
                    <Input
                      id="yearlyPrice"
                      type="number"
                      step="0.01"
                      value={editingPlan.yearlyPrice}
                      onChange={(e) => setEditingPlan({ ...editingPlan, yearlyPrice: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Limits (-1 for unlimited)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxVehicles">Max Vehicles</Label>
                    <Input
                      id="maxVehicles"
                      type="number"
                      value={editingPlan.limits.maxVehicles}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, maxVehicles: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxUsers">Max Users</Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      value={editingPlan.limits.maxUsers}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, maxUsers: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDrivers">Max Drivers</Label>
                    <Input
                      id="maxDrivers"
                      type="number"
                      value={editingPlan.limits.maxDrivers}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, maxDrivers: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Features</h3>
                  <Button onClick={handleAddFeature} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Feature
                  </Button>
                </div>
                <div className="space-y-2">
                  {editingPlan.features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                        placeholder="Feature description"
                      />
                      <Button
                        onClick={() => handleRemoveFeature(idx)}
                        size="sm"
                        variant="ghost"
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Status */}
              <div className="border-t pt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingPlan.isActive}
                  onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Plan is active</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowEditDialog(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
