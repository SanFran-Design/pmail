'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { ComposeEmail } from '@/types/email';

interface ComposeModalProps {
  onClose: () => void;
  onSend: (email: ComposeEmail) => void;
}

export default function ComposeModal({ onClose, onSend }: ComposeModalProps) {
  const [formData, setFormData] = useState<ComposeEmail>({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
  });

  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.to || !formData.subject) {
      alert('Please fill in the recipient and subject fields.');
      return;
    }

    setIsSending(true);
    try {
      await onSend(formData);
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (field: keyof ComposeEmail, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Compose Email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
            {/* To Field */}
            <div>
              <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                To *
              </label>
              <input
                type="email"
                id="to"
                value={formData.to}
                onChange={(e) => handleChange('to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                placeholder="recipient@example.com"
                required
              />
            </div>

            {/* CC Field */}
            <div>
              <label htmlFor="cc" className="block text-sm font-medium text-gray-700 mb-1">
                CC
              </label>
              <input
                type="email"
                id="cc"
                value={formData.cc}
                onChange={(e) => handleChange('cc', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                placeholder="cc@example.com"
              />
            </div>

            {/* BCC Field */}
            <div>
              <label htmlFor="bcc" className="block text-sm font-medium text-gray-700 mb-1">
                BCC
              </label>
              <input
                type="email"
                id="bcc"
                value={formData.bcc}
                onChange={(e) => handleChange('bcc', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                placeholder="bcc@example.com"
              />
            </div>

            {/* Subject Field */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                placeholder="Enter email subject"
                required
              />
            </div>

            {/* Body Field */}
            <div className="flex-1 min-h-[200px]">
              <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="body"
                value={formData.body}
                onChange={(e) => handleChange('body', e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical text-base h-full min-h-[200px]"
                placeholder="Type your message here..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-t bg-gray-50 flex-shrink-0">
            <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
              * Required fields
            </div>
            <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 sm:flex-none"
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center justify-center flex-1 sm:flex-none"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
