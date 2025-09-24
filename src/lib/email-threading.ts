import { EmailMessage, EmailThread } from '@/types/email';

/**
 * Normalize subject line for threading by removing common prefixes
 */
export function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(Re:|RE:|Fwd:|FWD:|Fw:|FW:)\s*/gi, '')
    .replace(/^\[.*?\]\s*/, '') // Remove mailing list prefixes like [List]
    .trim()
    .toLowerCase();
}

/**
 * Generate a thread ID from normalized subject and participants
 */
export function generateThreadId(subject: string, participants: string[]): string {
  const normalizedSubject = normalizeSubject(subject);
  const sortedParticipants = [...new Set(participants)].sort().join(',');
  return `${normalizedSubject}:${sortedParticipants}`;
}

/**
 * Check if two emails belong to the same thread based on headers
 */
export function emailsBelongToSameThread(email1: EmailMessage, email2: EmailMessage): boolean {
  // 1. Check Message-ID relationships
  if (email1.messageId && email2.inReplyTo === email1.messageId) return true;
  if (email2.messageId && email1.inReplyTo === email2.messageId) return true;
  
  // 2. Check if either references the other
  if (email1.references?.includes(email2.messageId || '')) return true;
  if (email2.references?.includes(email1.messageId || '')) return true;
  
  // 3. Check if they share common references
  if (email1.references && email2.references) {
    const commonRefs = email1.references.filter(ref => email2.references!.includes(ref));
    if (commonRefs.length > 0) return true;
  }
  
  // 4. Fallback to subject and participants
  const normalizedSubject1 = normalizeSubject(email1.subject);
  const normalizedSubject2 = normalizeSubject(email2.subject);
  
  if (normalizedSubject1 === normalizedSubject2 && normalizedSubject1.length > 0) {
    // Check if they share participants (same sender/recipients)
    const participants1 = [email1.from, ...email1.to, ...(email1.cc || [])];
    const participants2 = [email2.from, ...email2.to, ...(email2.cc || [])];
    
    // If there's overlap in participants and same subject, likely same thread
    const overlap = participants1.some(p => participants2.includes(p));
    if (overlap) return true;
  }
  
  return false;
}

/**
 * Group emails into threads using various threading techniques
 */
export function groupEmailsIntoThreads(emails: EmailMessage[]): EmailThread[] {
  const threads: EmailThread[] = [];
  const processedEmails = new Set<string>();
  
  // Sort emails by date (oldest first) for proper threading
  const sortedEmails = [...emails].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  for (const email of sortedEmails) {
    if (processedEmails.has(email.id)) continue;
    
    // Find all emails that belong to the same thread as this email
    const threadEmails = [email];
    processedEmails.add(email.id);
    
    // Look for related emails
    for (const otherEmail of sortedEmails) {
      if (processedEmails.has(otherEmail.id)) continue;
      
      // Check if this email belongs to the current thread
      const belongsToThread = threadEmails.some(threadEmail => 
        emailsBelongToSameThread(threadEmail, otherEmail)
      );
      
      if (belongsToThread) {
        threadEmails.push(otherEmail);
        processedEmails.add(otherEmail.id);
      }
    }
    
    // Sort emails within thread by date (oldest first)
    threadEmails.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Assign thread ID to all emails in this thread
    const threadId = generateThreadId(email.subject, [email.from, ...email.to]);
    threadEmails.forEach(e => e.threadId = threadId);
    
    // Create thread object
    const latestEmail = threadEmails[threadEmails.length - 1];
    const hasUnread = threadEmails.some(e => !e.read);
    
    const thread: EmailThread = {
      id: threadId,
      subject: normalizeSubject(email.subject) || 'No Subject',
      messages: threadEmails,
      latestDate: latestEmail.date,
      hasUnread,
      messageCount: threadEmails.length,
    };
    
    threads.push(thread);
  }
  
  // Sort threads by latest message date (newest first)
  return threads.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());
}

/**
 * Get the original subject line from a thread (without Re: prefixes)
 */
export function getThreadSubject(thread: EmailThread): string {
  // Find the earliest email in the thread (likely the original)
  const earliestEmail = thread.messages.reduce((earliest, current) => 
    new Date(current.date) < new Date(earliest.date) ? current : earliest
  );
  
  return normalizeSubject(earliestEmail.subject) || 'No Subject';
}

/**
 * Get thread summary info for display
 */
export function getThreadSummary(thread: EmailThread): {
  subject: string;
  latestSender: string;
  latestSenderName?: string;
  messageCount: number;
  hasUnread: boolean;
  latestDate: Date;
} {
  const latestMessage = thread.messages[thread.messages.length - 1];
  const originalSubject = getThreadSubject(thread);
  
  return {
    subject: originalSubject,
    latestSender: latestMessage.from,
    latestSenderName: latestMessage.fromName,
    messageCount: thread.messageCount,
    hasUnread: thread.hasUnread,
    latestDate: thread.latestDate,
  };
}
