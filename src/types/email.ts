export interface EmailMessage {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  date: Date;
  read: boolean;
  attachments?: EmailAttachment[];
  category: 'automated' | 'human';
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  content?: Buffer;
}

export interface EmailAccount {
  id: string;
  email: string;
  name: string;
  provider: 'gmail' | 'outlook' | 'custom';
  smtpConfig: SMTPConfig;
  imapConfig: IMAPConfig;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface IMAPConfig {
  host: string;
  port: number;
  tls: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface ComposeEmail {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  attachments?: File[];
}
