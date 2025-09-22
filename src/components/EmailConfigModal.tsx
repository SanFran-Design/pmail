'use client';

import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { EmailAccount } from '@/types/email';
import { createEmailAccount, EMAIL_PROVIDERS } from '@/lib/email-config';

interface EmailConfigModalProps {
  onClose: () => void;
  onSave: (config: EmailAccount) => void;
}

export default function EmailConfigModal({ onClose, onSave }: EmailConfigModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    provider: 'gmail' as keyof typeof EMAIL_PROVIDERS,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsTestingConnection(true);
    
    try {
      // Create email account configuration
      const emailAccount = createEmailAccount(
        formData.email,
        formData.password,
        formData.provider,
        formData.name || undefined
      );

      // TODO: Test the connection here
      console.log('Testing connection for:', emailAccount);
      
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave(emailAccount);
    } catch (error) {
      console.error('Failed to configure email account:', error);
      alert('Failed to configure email account. Please check your credentials and try again.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Configure Email Account</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Provider Selection */}
          <div>
            <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
              Email Provider
            </label>
            <select
              id="provider"
              value={formData.provider}
              onChange={(e) => handleChange('provider', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {Object.entries(EMAIL_PROVIDERS).map(([key, provider]) => (
                <option key={key} value={key}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="your.email@gmail.com"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password / App Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Your password or app password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {formData.provider === 'gmail' && (
              <p className="mt-1 text-xs text-gray-500">
                For Gmail, you must use an App Password. Enable 2FA and generate an App Password in your Google Account settings.
              </p>
            )}
          </div>

          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name (Optional)
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Your Name"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-1">Security Note</h4>
            <p className="text-xs text-blue-700">
              Your credentials are stored locally and used only to connect to your email server. 
              For Gmail, make sure to use an App Password instead of your regular password.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isTestingConnection}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={isTestingConnection}
            >
              {isTestingConnection ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Testing...
                </>
              ) : (
                'Save & Connect'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
