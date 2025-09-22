import { NextRequest, NextResponse } from 'next/server';
import Imap from 'imap';
import { simpleParser, AddressObject } from 'mailparser';
import { IMAPConfig, EmailMessage } from '@/types/email';

// Helper function to extract email addresses from mailparser AddressObject
function extractEmailAddresses(addressObj: any): string[] {
  if (!addressObj) return [];
  
  // If it's a string, return it as is
  if (typeof addressObj === 'string') return [addressObj];
  
  // Handle mailparser address object format
  if (addressObj.value && Array.isArray(addressObj.value)) {
    return addressObj.value.map((addr: any) => {
      if (typeof addr === 'string') return addr;
      return addr.address || addr.email || String(addr) || '';
    }).filter(Boolean);
  }
  
  // Handle direct address object
  if (addressObj.address) {
    return [String(addressObj.address)];
  }
  
  // Handle array of address objects
  if (Array.isArray(addressObj)) {
    return addressObj.map((addr: any) => {
      if (typeof addr === 'string') return addr;
      if (addr.address) return String(addr.address);
      if (addr.email) return String(addr.email);
      return String(addr.value || addr.text || addr || '');
    }).filter(Boolean);
  }
  
  // Fallback to text property
  if (addressObj.text) {
    // Extract email from "Name <email@domain.com>" format
    const emailMatch = addressObj.text.match(/<([^>]+)>/);
    if (emailMatch) return [emailMatch[1]];
    return [addressObj.text];
  }
  
  return [];
}

// Helper function to get a single email address (for 'from' field)
function getFirstEmailAddress(addressObj: any): string {
  const addresses = extractEmailAddresses(addressObj);
  const firstAddress = addresses[0] || 'Unknown';
  
  // Ensure we always return a string, never an object
  if (typeof firstAddress === 'object' && firstAddress !== null) {
    const addressAsAny = firstAddress as any;
    return addressAsAny?.address || addressAsAny?.email || String(firstAddress) || 'Unknown';
  }
  
  return String(firstAddress);
}

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

function fetchEmails(imap: Imap, limit: number = 10): Promise<EmailMessage[]> {
  return new Promise((resolve, reject) => {
    imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        reject(err);
        return;
      }

      // Search for recent emails
      imap.search(['ALL'], (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        if (!results || results.length === 0) {
          resolve([]);
          return;
        }

        // Get the most recent emails (limit to avoid overwhelming the client)
        const recentResults = results.slice(-limit);
        const emails: EmailMessage[] = [];

        const fetch = imap.fetch(recentResults, { bodies: '' });
        
        fetch.on('message', (msg, seqno) => {
          let buffer = '';
          let attributes: any = {};

          msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString();
            });
          });

          msg.once('attributes', (attrs) => {
            attributes = attrs;
          });

          msg.once('end', async () => {
            try {
              const parsed = await simpleParser(buffer);
              
              // Debug logging to understand address structure
              console.log('Email address debugging:', {
                from: parsed.from,
                to: parsed.to,
                cc: parsed.cc
              });
              
              const toAddresses = extractEmailAddresses(parsed.to);
              const ccAddresses = extractEmailAddresses(parsed.cc);
              
              // Ensure all addresses are strings
              const cleanToAddresses = toAddresses.map(addr => String(addr)).filter(Boolean);
              const cleanCcAddresses = ccAddresses.map(addr => String(addr)).filter(Boolean);
              
              const emailMessage: EmailMessage = {
                id: seqno.toString(),
                from: getFirstEmailAddress(parsed.from),
                to: cleanToAddresses,
                cc: cleanCcAddresses.length > 0 ? cleanCcAddresses : undefined,
                subject: parsed.subject || 'No Subject',
                body: parsed.text || parsed.html || 'No content',
                date: parsed.date || new Date(),
                read: attributes.flags?.includes('\\Seen') || false,
                attachments: parsed.attachments?.map(att => ({
                  filename: att.filename || 'unknown',
                  contentType: att.contentType,
                  size: att.size || 0,
                })),
              };

              console.log('Processed email message:', {
                id: emailMessage.id,
                from: emailMessage.from,
                to: emailMessage.to,
                cc: emailMessage.cc,
                subject: emailMessage.subject
              });

              emails.push(emailMessage);
            } catch (parseError) {
              console.error('Error parsing email:', parseError);
            }
          });
        });

        fetch.once('error', (err) => {
          reject(err);
        });

        fetch.once('end', () => {
          // Sort by date (newest first)
          emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          resolve(emails);
        });
      });
    });
  });
}

export async function POST(request: NextRequest) {
  let imap: Imap | null = null;

  try {
    const body = await request.json();
    const { imapConfig, limit = 10 }: { imapConfig: IMAPConfig; limit?: number } = body;

    if (!imapConfig) {
      return NextResponse.json(
        { error: 'IMAP configuration is required' },
        { status: 400 }
      );
    }

    // Connect to IMAP server
    imap = await connectToIMAP(imapConfig);
    
    // Fetch emails
    const emails = await fetchEmails(imap, limit);

    return NextResponse.json({
      success: true,
      emails,
      count: emails.length,
    });

  } catch (error) {
    console.error('Error fetching emails:', error);
    
    let errorMessage = 'Failed to fetch emails';
    if (error instanceof Error) {
      if (error.message.includes('Invalid credentials')) {
        errorMessage = 'Invalid email credentials. Please check your username and password.';
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('connect')) {
        errorMessage = 'Cannot connect to email server. Please check your network connection.';
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
