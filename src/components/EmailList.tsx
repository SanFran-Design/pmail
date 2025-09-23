'use client';

import { EmailMessage } from '@/types/email';
import { clsx } from 'clsx';
import { formatEmailDateTime } from '@/lib/utils';

interface EmailListProps {
  emails: EmailMessage[];
  selectedEmail: EmailMessage | null;
  onEmailSelect: (email: EmailMessage) => void;
  lastRefreshTime: Date | null;
}

export default function EmailList({ emails, selectedEmail, onEmailSelect, lastRefreshTime }: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No emails to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Inbox ({emails.length})</h2>
          {lastRefreshTime && (
            <div className="text-xs text-gray-500">
              Last updated: {formatEmailDateTime(lastRefreshTime)}
            </div>
          )}
        </div>
      </div>
      <div className="divide-y">
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => onEmailSelect(email)}
            className={clsx(
              'p-4 cursor-pointer hover:bg-gray-50 transition-colors',
              {
                'bg-blue-50 border-r-4 border-r-blue-500': selectedEmail?.id === email.id,
                'font-semibold': !email.read,
              }
            )}
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-sm font-medium text-gray-900 truncate">
                {email.from}
              </span>
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
            <p className="text-xs text-gray-500 truncate">
              {email.body.substring(0, 100)}...
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
