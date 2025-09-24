'use client';

import { useState, useEffect } from 'react';
import { EmailMessage, EmailAccount } from '@/types/email';
import { Mail, Send, RefreshCw, Settings, Plus, Reply } from 'lucide-react';
import EmailList from '@/components/EmailList';
import ComposeModal from '@/components/ComposeModal';
import EmailConfigModal from '@/components/EmailConfigModal';
import EmailContent from '@/components/EmailContent';
import { formatEmailDate, formatEmailDateTime } from '@/lib/utils';

export default function Home() {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [replyToEmail, setReplyToEmail] = useState<EmailMessage | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [emailAccount, setEmailAccount] = useState<EmailAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Check if user has saved email configuration on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('emailAccount');
    if (savedConfig) {
      try {
        const account = JSON.parse(savedConfig);
        setEmailAccount(account);
        setIsConfigured(true);
        // Auto-fetch emails on startup
        fetchEmails(account);
      } catch (error) {
        console.error('Failed to parse saved email config:', error);
        localStorage.removeItem('emailAccount');
      }
    }
  }, []);

  const fetchEmails = async (account?: EmailAccount) => {
    if (!account && !emailAccount) return;
    
    const currentAccount = account || emailAccount;
    if (!currentAccount) return; // Additional null check for TypeScript strict mode
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/email/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imapConfig: currentAccount.imapConfig,
          limit: 100,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setEmails(data.emails);
        setLastRefreshTime(new Date());
      } else {
        console.error('Failed to fetch emails:', data.error);
        alert(`Failed to fetch emails: ${data.error}`);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      alert('Failed to connect to email server. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchEmails();
  };

  const handleSendEmail = async (emailData: any) => {
    if (!emailAccount) {
      alert('No email account configured');
      return;
    }

    console.log('Sending email with data:', emailData);
    console.log('Using SMTP config:', {
      host: emailAccount.smtpConfig.host,
      port: emailAccount.smtpConfig.port,
      user: emailAccount.smtpConfig.auth.user
    });

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailData,
          smtpConfig: emailAccount.smtpConfig,
        }),
      });

      const data = await response.json();
      console.log('Email send response:', data);
      
      if (data.success) {
        alert('Email sent successfully!');
        setShowCompose(false);
        // Optionally refresh emails to show sent email
        await fetchEmails();
      } else {
        console.error('Email send failed:', data);
        alert(`Failed to send email: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Network error while sending email. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSelect = async (email: EmailMessage) => {
    setSelectedEmail(email);
    
    // If email is already read, no need to mark as read on server
    if (email.read) {
      return;
    }

    try {
      // Mark as read on the email server
      const response = await fetch('/api/email/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imapConfig: emailAccount?.imapConfig,
          emailId: email.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state only after successful server update
        setEmails(prev => 
          prev.map(e => e.id === email.id ? { ...e, read: true } : e)
        );
        console.log('Email marked as read on server');
      } else {
        console.error('Failed to mark email as read on server:', data.error);
        // Still update local state for better UX, but log the error
        setEmails(prev => 
          prev.map(e => e.id === email.id ? { ...e, read: true } : e)
        );
      }
    } catch (error) {
      console.error('Error marking email as read:', error);
      // Still update local state for better UX, but log the error
      setEmails(prev => 
        prev.map(e => e.id === email.id ? { ...e, read: true } : e)
      );
    }
  };

  const handleReply = (email: EmailMessage) => {
    setReplyToEmail(email);
    setShowCompose(true);
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <Mail className="mx-auto h-12 w-12 text-primary-500 mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Welcome to PMail</h1>
            <p className="text-sm sm:text-base text-gray-600">Configure your email account to get started</p>
          </div>
          <button
            onClick={() => setShowConfig(true)}
            className="btn-primary w-full"
          >
            Configure Email Account
          </button>
        </div>
        {showConfig && (
          <EmailConfigModal
            onClose={() => setShowConfig(false)}
            onSave={(config) => {
              // Save to localStorage for persistence
              localStorage.setItem('emailAccount', JSON.stringify(config));
              setEmailAccount(config);
              setIsConfigured(true);
              setShowConfig(false);
              // Fetch emails after configuration
              fetchEmails(config);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-primary-500 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">PMail</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setShowCompose(true)}
                className="btn-primary flex items-center text-sm sm:text-base"
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Compose</span>
              </button>
              <button
                onClick={handleRefresh}
                className="btn-secondary flex items-center text-sm sm:text-base"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isLoading ? 'Loading...' : 'Refresh'}</span>
              </button>
              <button
                onClick={() => setShowConfig(true)}
                className="btn-secondary flex items-center p-2 sm:px-4 sm:py-2"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 h-full">
          {/* Mobile: Show email list or email view based on selection */}
          <div className="block lg:hidden h-full">
            {selectedEmail ? (
              <div className="bg-white rounded-lg shadow h-full flex flex-col">
                {/* Mobile email view header with back button */}
                <div className="flex-shrink-0 border-b p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center flex-1 min-w-0">
                      <button
                        onClick={() => setSelectedEmail(null)}
                        className="mr-3 p-1 hover:bg-gray-100 rounded"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h2 className="text-lg font-semibold text-gray-900 truncate">
                        {selectedEmail.subject}
                      </h2>
                    </div>
                    <button
                      onClick={() => handleReply(selectedEmail)}
                      className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title="Reply"
                    >
                      <Reply className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="mb-1">From: {selectedEmail.from}</div>
                    <div>{formatEmailDate(selectedEmail.date)}</div>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <EmailContent 
                    content={selectedEmail.body}
                    className="prose max-w-none"
                  />
                </div>
              </div>
            ) : (
              <EmailList
                emails={emails}
                selectedEmail={selectedEmail}
                onEmailSelect={handleEmailSelect}
                lastRefreshTime={lastRefreshTime}
              />
            )}
          </div>

          {/* Desktop: Side-by-side layout */}
          <div className="hidden lg:flex flex-col lg:flex-row gap-6 h-full">
            {/* Email List */}
            <div className="flex-1 lg:max-w-md h-full">
              <EmailList
                emails={emails}
                selectedEmail={selectedEmail}
                onEmailSelect={handleEmailSelect}
                lastRefreshTime={lastRefreshTime}
              />
            </div>

            {/* Email View */}
            <div className="flex-1 h-full">
              {selectedEmail ? (
                <div className="bg-white rounded-lg shadow h-full flex flex-col">
                  <div className="flex-shrink-0 border-b p-6 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedEmail.subject}
                      </h2>
                      <button
                        onClick={() => handleReply(selectedEmail)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Reply"
                      >
                        <Reply className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>From: {selectedEmail.from}</span>
                      <span>{formatEmailDate(selectedEmail.date)}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-6">
                    <EmailContent 
                      content={selectedEmail.body}
                      className="prose max-w-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow h-full flex items-center justify-center">
                  <div className="text-center">
                    <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Select an email to view its contents</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCompose && (
        <ComposeModal
          onClose={() => {
            setShowCompose(false);
            setReplyToEmail(null);
          }}
          onSend={handleSendEmail}
          replyToEmail={replyToEmail}
        />
      )}
      {showConfig && (
        <EmailConfigModal
          onClose={() => setShowConfig(false)}
          onSave={(config) => {
            // Save updated config to localStorage
            localStorage.setItem('emailAccount', JSON.stringify(config));
            setEmailAccount(config);
            setShowConfig(false);
            // Fetch emails with new config
            fetchEmails(config);
          }}
        />
      )}
    </div>
  );
}
