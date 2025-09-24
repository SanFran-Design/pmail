'use client';

import { EmailMessage, EmailThread } from '@/types/email';
import { clsx } from 'clsx';
import { formatEmailDateTime } from '@/lib/utils';
import { getThreadSummary } from '@/lib/email-threading';
import { User, Bot, Mail, ChevronRight, ChevronDown, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface ThreadedEmailListProps {
  threads: EmailThread[];
  selectedEmail: EmailMessage | null;
  onEmailSelect: (email: EmailMessage) => void;
  lastRefreshTime: Date | null;
}

interface ThreadItemProps {
  thread: EmailThread;
  selectedEmail: EmailMessage | null;
  onEmailSelect: (email: EmailMessage) => void;
  iconColor: string;
  borderColor: string;
}

function ThreadItem({ thread, selectedEmail, onEmailSelect, iconColor, borderColor }: ThreadItemProps) {
  const [isExpanded, setIsExpanded] = useState(
    // Auto-expand if any message in the thread is selected
    thread.messages.some(msg => msg.id === selectedEmail?.id)
  );
  
  const summary = getThreadSummary(thread);
  const isThreadSelected = thread.messages.some(msg => msg.id === selectedEmail?.id);
  
  const handleThreadToggle = () => {
    if (thread.messageCount === 1) {
      // If it's a single message thread, just select the message
      onEmailSelect(thread.messages[0]);
    } else {
      // Toggle expansion for multi-message threads
      setIsExpanded(!isExpanded);
    }
  };

  const handleMessageClick = (email: EmailMessage, e: React.MouseEvent) => {
    e.stopPropagation();
    onEmailSelect(email);
  };

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      {/* Thread Summary */}
      <div
        onClick={handleThreadToggle}
        className={clsx(
          'p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors touch-manipulation',
          {
            'bg-blue-50 border-r-4 border-r-blue-500': isThreadSelected,
            'font-semibold': summary.hasUnread,
          }
        )}
      >
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {thread.messageCount > 1 && (
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              )}
              {thread.messageCount > 1 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MessageSquare className="h-3 w-3" />
                  <span>{thread.messageCount}</span>
                </div>
              )}
            </div>
            
            {summary.latestSenderName ? (
              <div>
                <span className="text-sm font-medium text-gray-900 truncate block">
                  {summary.latestSenderName}
                </span>
                <span className="text-xs text-gray-500 truncate block">
                  {summary.latestSender}
                </span>
              </div>
            ) : (
              <span className="text-sm font-medium text-gray-900 truncate block">
                {summary.latestSender}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
            {formatEmailDateTime(summary.latestDate)}
          </span>
        </div>
        
        <h3 className={clsx(
          'text-sm truncate mb-1',
          summary.hasUnread ? 'text-gray-900 font-medium' : 'text-gray-700'
        )}>
          {summary.subject}
        </h3>
        
        <p className="text-xs text-gray-500 truncate leading-relaxed">
          {thread.messages[thread.messages.length - 1].body.substring(0, 80)}...
        </p>
        
        {summary.hasUnread && (
          <div className="mt-2">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
          </div>
        )}
      </div>

      {/* Expanded Thread Messages */}
      {isExpanded && thread.messageCount > 1 && (
        <div className="ml-4 border-l-2 border-gray-100">
          {thread.messages.map((message, index) => (
            <div
              key={message.id}
              onClick={(e) => handleMessageClick(message, e)}
              className={clsx(
                'p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0',
                {
                  'bg-blue-50': selectedEmail?.id === message.id,
                  'font-semibold': !message.read,
                }
              )}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  {message.fromName ? (
                    <div>
                      <span className="text-xs font-medium text-gray-800 truncate block">
                        {message.fromName}
                      </span>
                      <span className="text-xs text-gray-500 truncate block">
                        {message.from}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-gray-800 truncate block">
                      {message.from}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                  {formatEmailDateTime(message.date)}
                </span>
              </div>
              
              <h4 className={clsx(
                'text-xs truncate mb-1',
                message.read ? 'text-gray-600' : 'text-gray-800 font-medium'
              )}>
                {message.subject}
              </h4>
              
              <p className="text-xs text-gray-500 truncate leading-relaxed">
                {message.body.substring(0, 60)}...
              </p>
              
              {!message.read && (
                <div className="mt-1">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ThreadSectionProps {
  title: string;
  icon: React.ReactNode;
  threads: EmailThread[];
  selectedEmail: EmailMessage | null;
  onEmailSelect: (email: EmailMessage) => void;
  iconColor: string;
  borderColor: string;
}

function ThreadSection({ title, icon, threads, selectedEmail, onEmailSelect, iconColor, borderColor }: ThreadSectionProps) {
  if (threads.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 last:mb-0">
      <div className={`p-3 bg-gray-50 border-l-4 ${borderColor} flex items-center gap-2`}>
        <div className={iconColor}>
          {icon}
        </div>
        <h3 className="font-medium text-gray-700 text-sm">
          {title} ({threads.length})
        </h3>
      </div>
      <div>
        {threads.map((thread) => (
          <ThreadItem
            key={thread.id}
            thread={thread}
            selectedEmail={selectedEmail}
            onEmailSelect={onEmailSelect}
            iconColor={iconColor}
            borderColor={borderColor}
          />
        ))}
      </div>
    </div>
  );
}

export default function ThreadedEmailList({ threads, selectedEmail, onEmailSelect, lastRefreshTime }: ThreadedEmailListProps) {
  if (threads.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow h-full flex items-center justify-center">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No emails to display</p>
        </div>
      </div>
    );
  }

  // Separate threads by category based on latest message
  const humanThreads = threads.filter(thread => 
    thread.messages[thread.messages.length - 1].category === 'human'
  );
  const automatedThreads = threads.filter(thread => 
    thread.messages[thread.messages.length - 1].category === 'automated'
  );

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      <div className="p-3 sm:p-4 border-b flex-shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">
            Inbox ({threads.length} threads)
          </h2>
          {lastRefreshTime && (
            <div className="text-xs text-gray-500 hidden sm:block">
              Last updated: {formatEmailDateTime(lastRefreshTime)}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-2">
          <ThreadSection
            title="Needs Response"
            icon={<User className="h-4 w-4" />}
            threads={humanThreads}
            selectedEmail={selectedEmail}
            onEmailSelect={onEmailSelect}
            iconColor="text-blue-600"
            borderColor="border-l-blue-500"
          />
          <ThreadSection
            title="Newsletters & Updates"
            icon={<Bot className="h-4 w-4" />}
            threads={automatedThreads}
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
