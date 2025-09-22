import { SMTPConfig, IMAPConfig, EmailAccount } from '@/types/email';

// Gmail configuration presets
export const GMAIL_SMTP_CONFIG: Omit<SMTPConfig, 'auth'> = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
};

export const GMAIL_IMAP_CONFIG: Omit<IMAPConfig, 'auth'> = {
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
};

// Common email provider configurations
export const EMAIL_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    smtp: GMAIL_SMTP_CONFIG,
    imap: GMAIL_IMAP_CONFIG,
  },
  outlook: {
    name: 'Outlook',
    smtp: {
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
    },
    imap: {
      host: 'outlook.office365.com',
      port: 993,
      tls: true,
    },
  },
  yahoo: {
    name: 'Yahoo',
    smtp: {
      host: 'smtp.mail.yahoo.com',
      port: 587,
      secure: false,
    },
    imap: {
      host: 'imap.mail.yahoo.com',
      port: 993,
      tls: true,
    },
  },
} as const;

export function createEmailAccount(
  email: string,
  password: string,
  provider: keyof typeof EMAIL_PROVIDERS = 'gmail',
  name?: string
): EmailAccount {
  const providerConfig = EMAIL_PROVIDERS[provider];
  
  return {
    id: crypto.randomUUID(),
    email,
    name: name || email.split('@')[0],
    provider: provider as any,
    smtpConfig: {
      ...providerConfig.smtp,
      auth: {
        user: email,
        pass: password,
      },
    },
    imapConfig: {
      ...providerConfig.imap,
      auth: {
        user: email,
        pass: password,
      },
    },
  };
}

export function validateEmailConfig(config: EmailAccount): boolean {
  const { smtpConfig, imapConfig } = config;
  
  return !!(
    smtpConfig.host &&
    smtpConfig.port &&
    smtpConfig.auth.user &&
    smtpConfig.auth.pass &&
    imapConfig.host &&
    imapConfig.port &&
    imapConfig.auth.user &&
    imapConfig.auth.pass
  );
}
