/**
 * White-Label Settings Component
 * Manage white-labeling configuration (PREMIUM feature)
 */

'use client';

import { useState, useEffect } from 'react';
import { useFeatureAccess, PREMIUM_FEATURES } from '@/hooks/useFeatureAccess';
import { UpgradePrompt } from '@/components/upgrade/UpgradePrompt';
import { Save, Upload, Eye, AlertCircle } from 'lucide-react';

interface WhiteLabelData {
  companyName: string;
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customDomain?: string;
  customDomainVerified: boolean;
  emailFromName?: string;
  emailFromAddress?: string;
  supportEmail?: string;
  supportPhone?: string;
  termsUrl?: string;
  privacyUrl?: string;
  customCss?: string;
  customFooter?: string;
}

export function WhiteLabelSettings() {
  const { hasAccess, getRequiredPlan, loading: featureLoading } = useFeatureAccess();
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const canAccess = hasAccess('WHITE_LABELING');

  useEffect(() => {
    if (!featureLoading) {
      if (canAccess) {
        fetchWhiteLabel();
      } else {
        setLoading(false);
      }
    }
  }, [canAccess, featureLoading]);

  const fetchWhiteLabel = async () => {
    try {
      const response = await fetch('/api/white-label');
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setWhiteLabel(data.data);
        } else {
          // Initialize with defaults
          setWhiteLabel({
            companyName: '',
            primaryColor: '#3b82f6',
            secondaryColor: '#1e40af',
            accentColor: '#10b981',
            customDomainVerified: false,
          });
        }
      }
    } catch (err) {
      setError('Failed to load white-label settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!whiteLabel) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const method = whiteLabel.companyName ? 'PATCH' : 'POST';
      const response = await fetch('/api/white-label', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whiteLabel),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('White-label settings saved successfully');
        setWhiteLabel(data.data);
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setError('Failed to save white-label settings');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    try {
      const response = await fetch('/api/white-label/verify-domain', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.verified) {
        setSuccess('Domain verified successfully!');
        fetchWhiteLabel();
      } else {
        setError(data.message || 'Domain verification failed');
      }
    } catch (err) {
      setError('Failed to verify domain');
    }
  };

  if (featureLoading || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="p-6">
        <UpgradePrompt
          feature="White-Labeling"
          plan={getRequiredPlan('WHITE_LABELING')}
          variant="inline"
          description="Customize your fleet management system with your own branding, colors, and domain."
          benefits={[
            'Custom logo and favicon',
            'Brand colors throughout the app',
            'Custom domain name',
            'Branded email communications',
            'Custom CSS for advanced styling',
            'Custom footer content',
          ]}
        />
      </div>
    );
  }

  if (!whiteLabel) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          White-Label Settings
        </h2>
        <p className="text-gray-600">
          Customize your fleet management system with your own branding.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={whiteLabel.companyName}
              onChange={(e) =>
                setWhiteLabel({ ...whiteLabel, companyName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Your Company Name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Support Email
              </label>
              <input
                type="email"
                value={whiteLabel.supportEmail || ''}
                onChange={(e) =>
                  setWhiteLabel({ ...whiteLabel, supportEmail: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="support@yourcompany.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Support Phone
              </label>
              <input
                type="tel"
                value={whiteLabel.supportPhone || ''}
                onChange={(e) =>
                  setWhiteLabel({ ...whiteLabel, supportPhone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Brand Colors
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={whiteLabel.primaryColor}
                onChange={(e) =>
                  setWhiteLabel({ ...whiteLabel, primaryColor: e.target.value })
                }
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={whiteLabel.primaryColor}
                onChange={(e) =>
                  setWhiteLabel({ ...whiteLabel, primaryColor: e.target.value })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={whiteLabel.secondaryColor}
                onChange={(e) =>
                  setWhiteLabel({
                    ...whiteLabel,
                    secondaryColor: e.target.value,
                  })
                }
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={whiteLabel.secondaryColor}
                onChange={(e) =>
                  setWhiteLabel({
                    ...whiteLabel,
                    secondaryColor: e.target.value,
                  })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accent Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={whiteLabel.accentColor}
                onChange={(e) =>
                  setWhiteLabel({ ...whiteLabel, accentColor: e.target.value })
                }
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={whiteLabel.accentColor}
                onChange={(e) =>
                  setWhiteLabel({ ...whiteLabel, accentColor: e.target.value })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Custom Domain */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Custom Domain
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domain Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={whiteLabel.customDomain || ''}
                onChange={(e) =>
                  setWhiteLabel({
                    ...whiteLabel,
                    customDomain: e.target.value,
                  })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="fleet.yourcompany.com"
              />
              <button
                onClick={handleVerifyDomain}
                disabled={!whiteLabel.customDomain}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify
              </button>
            </div>
            {whiteLabel.customDomainVerified ? (
              <p className="text-sm text-green-600 mt-2">
                ✓ Domain verified
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-2">
                Point your domain CNAME to: app.fleetmanager.com
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !whiteLabel.companyName}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
