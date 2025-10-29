'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface IpWhitelistItem {
  id: string;
  ipAddress: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface IpWhitelistManagerProps {
  userId: string;
}

export function IpWhitelistManager({ userId }: IpWhitelistManagerProps) {
  const [whitelist, setWhitelist] = useState<IpWhitelistItem[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIp, setNewIp] = useState({ ipAddress: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchWhitelist();
  }, [userId]);

  const fetchWhitelist = async () => {
    try {
      const response = await fetch('/api/admin/ip-whitelist');
      const data = await response.json();
      
      if (response.ok) {
        setWhitelist(data.whitelist || []);
        setIsEnabled(data.isEnabled || false);
      }
    } catch (err) {
      console.error('Failed to fetch whitelist:', err);
    }
  };

  const toggleWhitelist = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'toggle-whitelist',
          enabled: !isEnabled
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEnabled(!isEnabled);
        setSuccess(isEnabled ? 'IP whitelist disabled' : 'IP whitelist enabled');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to toggle whitelist');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addIpAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'add-ip',
          ipAddress: newIp.ipAddress,
          description: newIp.description
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setWhitelist(prev => [...prev, data.ip]);
        setNewIp({ ipAddress: '', description: '' });
        setShowAddForm(false);
        setSuccess('IP address added successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to add IP address');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeIpAddress = async (ipId: string) => {
    if (!confirm('Are you sure you want to remove this IP address?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'remove-ip',
          ipId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setWhitelist(prev => prev.filter(ip => ip.id !== ipId));
        setSuccess('IP address removed successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to remove IP address');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentIp = () => {
    // This would typically come from the server
    return '192.168.1.100'; // Placeholder
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            IP Whitelist Management
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Restrict admin access to specific IP addresses
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
          <button
            onClick={toggleWhitelist}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Warning */}
      {isEnabled && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Warning: IP Whitelist Active
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  Incorrect configuration may lock you out of your admin account.
                  Make sure your current IP ({getCurrentIp()}) is in the whitelist.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Add IP Form */}
      {showAddForm && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Add IP Address
          </h4>
          <form onSubmit={addIpAddress} className="space-y-3">
            <div>
              <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                IP Address
              </label>
              <input
                id="ipAddress"
                type="text"
                value={newIp.ipAddress}
                onChange={(e) => setNewIp(prev => ({ ...prev, ipAddress: e.target.value }))}
                placeholder="192.168.1.100 or 192.168.1.0/24"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <input
                id="description"
                type="text"
                value={newIp.description}
                onChange={(e) => setNewIp(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Office - Harare"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add IP'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IP Addresses List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              Allowed IP Addresses
            </h4>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add IP
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {whitelist.length > 0 ? (
            whitelist.map((ip) => (
              <div key={ip.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {ip.ipAddress}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {ip.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Added {new Date(ip.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => removeIpAddress(ip.id)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-500 disabled:opacity-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No IP addresses configured
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add IP addresses to restrict admin access.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Help */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          IP Address Formats:
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Single IP: 192.168.1.100</li>
          <li>• IP Range: 192.168.1.0/24</li>
          <li>• Multiple ranges: 192.168.1.0/24, 10.0.0.0/8</li>
        </ul>
      </div>
    </div>
  );
}
