'use client';

import { EmailMessage } from '@/types/email';
import { clsx } from 'clsx';
import { formatEmailDateTime } from '@/lib/utils';
import { User, Bot, Mail } from 'lucide-react';

interface EmailListProps {
  emails: EmailMessage[];
  selectedEmail: EmailMessage | null;
  onEmailSelect: (email: EmailMessage) => void;
  lastRefreshTime: Date | null;
}

interface EmailSectionProps {
  title: string;
  icon: React.ReactNode;
  emails: EmailMessage[];
  selectedEmail: EmailMessage | null;
  onEmailSelect: (email: EmailMessage) => void;
  iconColor: string;
  borderColor: string;
}

function EmailSection({ title, icon, emails, selectedEmail, onEmailSelect, iconColor, borderColor }: EmailSectionProps) {
  if (emails.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 last:mb-0">
      <div className={`p-3 bg-gray-50 border-l-4 ${borderColor} flex items-center gap-2`}>
        <div className={iconColor}>
          {icon}
        </div>
        <h3 className="font-medium text-gray-700 text-sm">
          {title} ({emails.length})
        </h3>
      </div>
      <div className="divide-y">
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => onEmailSelect(email)}
            className={clsx(
              'p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors touch-manipulation',
              {
                'bg-blue-50 border-r-4 border-r-blue-500': selectedEmail?.id === email.id,
                'font-semibold': !email.read,
              }
            )}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0">
                {email.fromName ? (
                  <div>
                    <span className="text-sm font-medium text-gray-900 truncate block">
                      {email.fromName}
                    </span>
                    <span className="text-xs text-gray-500 truncate block">
                      {email.from}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-gray-900 truncate block">
                    {email.from}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {formatEmailDateTime(email.date)}
              </span>
            </div>
            <h3 className={clsx(
              'text-sm truncate mb-1',
              email.read ? 'text-gray-700' : 'text-gray-900 font-medium'
            )}>
              {email.subject}
            </h3>
            <p className="text-xs text-gray-500 truncate leading-relaxed">
              {email.body.substring(0, 80)}...
            </p>
            {!email.read && (
              <div className="mt-2">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EmailList({ emails, selectedEmail, onEmailSelect, lastRefreshTime }: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow h-full flex items-center justify-center">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No emails to display</p>
        </div>
      </div>
    );
  }

  // Separate emails by category
  const humanEmails = emails.filter(email => email.category === 'human');
  const automatedEmails = emails.filter(email => email.category === 'automated');

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      <div className="p-3 sm:p-4 border-b flex-shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Inbox ({emails.length})</h2>
          {lastRefreshTime && (
            <div className="text-xs text-gray-500 hidden sm:block">
              Last updated: {formatEmailDateTime(lastRefreshTime)}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-2">
          <EmailSection
            title="Needs Response"
            icon={<User className="h-4 w-4" />}
            emails={humanEmails}
            selectedEmail={selectedEmail}
            onEmailSelect={onEmailSelect}
            iconColor="text-blue-600"
            borderColor="border-l-blue-500"
          />
          <EmailSection
            title="Newsletters & Updates"
            icon={<Bot className="h-4 w-4" />}
            emails={automatedEmails}
            selectedEmail={selectedEmail}
            onEmailSelect={onEmailSelect}
            iconColor="text-gray-600"
            borderColor="border-l-gray-400"
          />
        </div>
      </div>
    </div>
  );
}
