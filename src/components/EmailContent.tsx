'use client';

import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

interface EmailContentProps {
  content: string;
  className?: string;
}

// Helper function to detect if content is HTML
function isHtmlContent(content: string): boolean {
  // Basic HTML detection - look for HTML tags
  const htmlTags = /<\/?[a-z][\s\S]*>/i;
  return htmlTags.test(content);
}

// Helper function to sanitize HTML content
function sanitizeHtml(html: string): string {
  // Configure DOMPurify to allow common email HTML elements
  const config = {
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'br', 'strong', 'b', 'em', 'i', 'u',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img', 
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'blockquote', 'pre', 'code',
      'font', 'center', // Common in email HTML
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'width', 'height',
      'style', 'class', 'id',
      'colspan', 'rowspan',
      'color', 'size', 'face', // Font attributes
      'align', 'valign', 'border', 'cellpadding', 'cellspacing', // Table attributes
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  };
  
  return DOMPurify.sanitize(html, config);
}

export default function EmailContent({ content, className = '' }: EmailContentProps) {
  const [sanitizedContent, setSanitizedContent] = useState<string>('');
  const [isHtml, setIsHtml] = useState<boolean>(false);

  useEffect(() => {
    const htmlContent = isHtmlContent(content);
    setIsHtml(htmlContent);
    
    if (htmlContent) {
      // Sanitize HTML content
      const sanitized = sanitizeHtml(content);
      setSanitizedContent(sanitized);
    }
  }, [content]);

  if (isHtml) {
    return (
      <div 
        className={`email-html-content ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        style={{
          // Basic email styling reset
          lineHeight: '1.6',
          color: '#333',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      />
    );
  }

  // Render as plain text
  return (
    <div className={`email-text-content ${className}`}>
      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
        {content}
      </pre>
    </div>
  );
}
