/**
 * Safely converts a date string or Date object to a formatted date string
 * @param date - Date object or date string
 * @returns Formatted date string
 */
export function formatEmailDate(date: Date | string): string {
  try {
    if (typeof date === 'string') {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString();
    } else if (date instanceof Date) {
      return date.toLocaleDateString();
    } else {
      return 'Unknown date';
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Safely converts a date string or Date object to a formatted date and time string
 * @param date - Date object or date string
 * @returns Formatted date and time string
 */
export function formatEmailDateTime(date: Date | string): string {
  try {
    if (typeof date === 'string') {
      const dateObj = new Date(date);
      return dateObj.toLocaleString();
    } else if (date instanceof Date) {
      return date.toLocaleString();
    } else {
      return 'Unknown date';
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Categorizes an email as either 'automated' (has unsubscribe links, likely newsletters/notifications) 
 * or 'human' (likely personal emails that need responses)
 */
export function categorizeEmail(fromAddress: string, subject: string, body: string): 'automated' | 'human' {
  const lowercaseFrom = fromAddress.toLowerCase();
  const lowercaseSubject = subject.toLowerCase();
  const lowercaseBody = body.toLowerCase();
  
  // Check sender patterns that indicate automated emails
  const automatedSenderPatterns = [
    'noreply@', 'no-reply@', 'donotreply@', 'do-not-reply@',
    'notification@', 'notifications@', 'alerts@', 'alert@',
    'support@', 'help@', 'info@', 'newsletter@',
    'marketing@', 'promo@', 'promotions@', 'offers@',
    'automated@', 'system@', 'robot@', 'bot@',
    'updates@', 'news@', 'admin@', 'service@'
  ];
  
  // Check if sender matches automated patterns
  if (automatedSenderPatterns.some(pattern => lowercaseFrom.includes(pattern))) {
    return 'automated';
  }
  
  // Check for unsubscribe-related content
  const unsubscribePatterns = [
    'unsubscribe', 'opt out', 'opt-out', 'optout',
    'manage preferences', 'email preferences', 'subscription',
    'stop receiving', 'remove me', 'click here to stop',
    'update your preferences', 'manage your subscriptions',
    'list-unsubscribe', 'mailto:.*unsubscribe'
  ];
  
  if (unsubscribePatterns.some(pattern => lowercaseBody.includes(pattern))) {
    return 'automated';
  }
  
  // Check subject patterns that indicate automated emails
  const automatedSubjectPatterns = [
    'newsletter', 'weekly digest', 'daily digest', 'update',
    'notification', 'alert', 'reminder', 'welcome to',
    'thanks for signing up', 'confirm your', 'verify your',
    'password reset', 'account created', 'invoice',
    'receipt', 'order confirmation', 'shipping',
    'promotional', 'special offer', 'limited time'
  ];
  
  if (automatedSubjectPatterns.some(pattern => lowercaseSubject.includes(pattern))) {
    return 'automated';
  }
  
  // Check for HTML links with unsubscribe-like URLs
  const unsubscribeLinkPatterns = [
    /href=["'][^"']*unsubscribe[^"']*["']/gi,
    /href=["'][^"']*opt[_-]?out[^"']*["']/gi,
    /href=["'][^"']*preferences[^"']*["']/gi,
    /href=["'][^"']*manage[_-]?subscription[^"']*["']/gi
  ];
  
  if (unsubscribeLinkPatterns.some(pattern => pattern.test(body))) {
    return 'automated';
  }
  
  // Check for common automated email indicators in content
  const automatedContentPatterns = [
    'this is an automated', 'automated message', 'do not reply to this',
    'this email was sent to', 'you are receiving this because',
    'sent via', 'powered by', 'mailchimp', 'constant contact',
    'campaign monitor', 'sendgrid', 'mandrill'
  ];
  
  if (automatedContentPatterns.some(pattern => lowercaseBody.includes(pattern))) {
    return 'automated';
  }
  
  // Default to human if no automated patterns found
  return 'human';
}
