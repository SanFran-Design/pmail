import { NextRequest, NextResponse } from 'next/server';
import Imap from 'imap';
import { IMAPConfig } from '@/types/email';

function connectToIMAP(config: IMAPConfig): Promise<Imap> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.auth.user,
      password: config.auth.pass,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once('ready', () => resolve(imap));
    imap.once('error', (err: Error) => reject(err));
    imap.connect();
  });
}

function markEmailAsRead(imap: Imap, emailId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        reject(err);
        return;
      }

      // Convert email ID to UID (persistent identifier)
      const uid = parseInt(emailId, 10);
      
      if (isNaN(uid)) {
        reject(new Error('Invalid email UID format'));
        return;
      }

      // Use the UID directly with setFlags to ensure the Seen flag is set
      console.log(`Attempting to mark UID ${uid} as read...`);
      
      imap.setFlags(`${uid}`, ['\\Seen'], (err) => {
        if (err) {
          console.error(`Error setting flags for UID ${uid}:`, err);
          reject(err);
          return;
        }
        
        console.log(`Successfully marked email UID ${emailId} as read on server`);
        resolve();
      });
    });
  });
}

export async function POST(request: NextRequest) {
  let imap: Imap | null = null;

  try {
    const body = await request.json();
    const { imapConfig, emailId }: { imapConfig: IMAPConfig; emailId: string } = body;

    if (!imapConfig) {
      return NextResponse.json(
        { error: 'IMAP configuration is required' },
        { status: 400 }
      );
    }

    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }

    // Connect to IMAP server
    imap = await connectToIMAP(imapConfig);
    
    // Mark email as read
    await markEmailAsRead(imap, emailId);

    return NextResponse.json({
      success: true,
      message: `Email ${emailId} marked as read`,
    });

  } catch (error) {
    console.error('Error marking email as read:', error);
    
    let errorMessage = 'Failed to mark email as read';
    if (error instanceof Error) {
      if (error.message.includes('Invalid credentials')) {
        errorMessage = 'Invalid email credentials. Please check your username and password.';
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('connect')) {
        errorMessage = 'Cannot connect to email server. Please check your network connection.';
      } else if (error.message.includes('Invalid email ID')) {
        errorMessage = 'Invalid email ID format';
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    // Always close the IMAP connection
    if (imap && imap.state === 'authenticated') {
      imap.end();
    }
  }
}
