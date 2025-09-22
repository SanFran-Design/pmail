import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import Imap from 'imap';
import { SMTPConfig, IMAPConfig } from '@/types/email';

async function testSMTPConnection(config: SMTPConfig): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });

    await transporter.verify();
    return true;
  } catch (error) {
    console.error('SMTP test failed:', error);
    return false;
  }
}

async function testIMAPConnection(config: IMAPConfig): Promise<boolean> {
  return new Promise((resolve) => {
    const imap = new Imap({
      user: config.auth.user,
      password: config.auth.pass,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: { rejectUnauthorized: false },
    });

    let resolved = false;

    const cleanup = () => {
      if (imap.state === 'authenticated') {
        imap.end();
      }
    };

    imap.once('ready', () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(true);
      }
    });

    imap.once('error', (err: Error) => {
      console.error('IMAP test failed:', err);
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(false);
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(false);
      }
    }, 10000);

    imap.connect();
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { smtpConfig, imapConfig }: { smtpConfig?: SMTPConfig; imapConfig?: IMAPConfig } = body;

    if (!smtpConfig && !imapConfig) {
      return NextResponse.json(
        { error: 'At least one configuration (SMTP or IMAP) is required' },
        { status: 400 }
      );
    }

    const results: { smtp?: boolean; imap?: boolean } = {};

    // Test SMTP connection if provided
    if (smtpConfig) {
      results.smtp = await testSMTPConnection(smtpConfig);
    }

    // Test IMAP connection if provided
    if (imapConfig) {
      results.imap = await testIMAPConnection(imapConfig);
    }

    const allTestsPassed = Object.values(results).every(result => result === true);

    return NextResponse.json({
      success: allTestsPassed,
      results,
      message: allTestsPassed 
        ? 'All connections successful'
        : 'One or more connections failed',
    });

  } catch (error) {
    console.error('Error testing connections:', error);
    return NextResponse.json(
      { error: 'Failed to test connections' },
      { status: 500 }
    );
  }
}
