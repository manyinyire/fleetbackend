'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { TwoFactorSetup } from '@/components/admin/two-factor-setup';
import { TwoFactorVerification } from '@/components/admin/two-factor-verification';
import { signIn } from '@/lib/auth-client';
import { toast } from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'login' | '2fa-setup' | '2fa-verify'>('login');
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberDevice: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [twoFactorData, setTwoFactorData] = useState<any>(null);

  useEffect(() => {
    // Check if this is a setup redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('setup') === '2fa') {
      setIsSetupMode(true);
      setStep('2fa-setup');
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn.email({
        email: formData.email,
        password: formData.password,
      });

      if (result.error) {
        setError(result.error.message || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Check if user is SUPER_ADMIN (role check is handled by the API)
      if (!result.data?.user) {
        setError('Access denied. Super Admin privileges required.');
        setIsLoading(false);
        return;
      }

      toast.success('Login successful!');

      // Give time for the session cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect to admin dashboard
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  const handle2FASetup = async (totpCode: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: twoFactorData.userId,
          action: 'verify-2fa',
          totpCode
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push('/admin/dashboard');
      } else {
        setError(data.error || '2FA verification failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASetupComplete = (data: any) => {
    setTwoFactorData(data);
    setStep('2fa-verify');
  };

  if (step === '2fa-setup') {
    return (
      <TwoFactorSetup 
        onComplete={handle2FASetupComplete}
        onBack={() => setStep('login')}
      />
    );
  }

  if (step === '2fa-verify') {
    return (
      <TwoFactorVerification 
        onVerify={handle2FASetup}
        onBack={() => setStep('login')}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
            <ShieldCheckIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Super Admin Access
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Secure administrative portal for platform management
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Restricted Area
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>
                  This is a restricted area. All access is logged and monitored.
                  Unauthorized access attempts will be reported.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="admin@azaire.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Device */}
            <div className="flex items-center">
              <input
                id="rememberDevice"
                name="rememberDevice"
                type="checkbox"
                checked={formData.rememberDevice}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="rememberDevice" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Remember this device (7 days)
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          {/* Security Features */}
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>🔒 Enhanced security with 2FA</p>
              <p>🌐 IP whitelist protection</p>
              <p>⏰ Session timeout: 30 minutes</p>
              <p>📊 All actions logged and audited</p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Need help? Contact{' '}
            <a href="mailto:support@azaire.com" className="text-indigo-600 hover:text-indigo-500">
              support@azaire.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
