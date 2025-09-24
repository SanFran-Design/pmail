import { NextRequest, NextResponse } from 'next/server';
import Imap from 'imap';
import { simpleParser, AddressObject } from 'mailparser';
import { IMAPConfig, EmailMessage } from '@/types/email';
import { categorizeEmail } from '@/lib/utils';
import { groupEmailsIntoThreads } from '@/lib/email-threading';

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

// Helper function to extract both sender name and email address
function getSenderInfo(addressObj: any): { email: string; name?: string } {
  if (!addressObj) return { email: 'Unknown' };
  
  // Handle mailparser address object format with value array
  if (addressObj.value && Array.isArray(addressObj.value) && addressObj.value.length > 0) {
    const first = addressObj.value[0];
    if (first.name && first.address) {
      return { email: String(first.address), name: String(first.name) };
    }
    if (first.address) {
      return { email: String(first.address) };
    }
  }
  
  // Handle direct address object
  if (addressObj.name && addressObj.address) {
    return { email: String(addressObj.address), name: String(addressObj.name) };
  }
  
  // Handle text format like "John Doe <john@example.com>"
  if (addressObj.text) {
    const nameEmailMatch = addressObj.text.match(/^(.+?)\s*<([^>]+)>$/);
    if (nameEmailMatch) {
      return { 
        email: nameEmailMatch[2].trim(), 
        name: nameEmailMatch[1].trim() 
      };
    }
    // If no angle brackets, assume it's just an email
    return { email: addressObj.text };
  }
  
  // Fallback to just email address
  const email = getFirstEmailAddress(addressObj);
  return { email };
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

        const fetch = imap.fetch(recentResults, { 
          bodies: '', 
          struct: true, 
          envelope: true 
        });
        
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
            // Debug logging for attributes including UID
            console.log(`Email seqno ${seqno} attributes:`, {
              uid: attrs.uid,
              flags: attrs.flags,
              hasUID: !!attrs.uid
            });
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
              
              const senderInfo = getSenderInfo(parsed.from);
              const subject = parsed.subject || 'No Subject';
              const body = parsed.text || parsed.html || 'No content';
              
              // Extract threading headers
              const messageId = parsed.messageId || parsed.headers.get('message-id')?.toString();
              const inReplyTo = parsed.inReplyTo || parsed.headers.get('in-reply-to')?.toString();
              const referencesHeader = parsed.references || parsed.headers.get('references')?.toString();
              
              // Parse references header into array
              let references: string[] = [];
              if (referencesHeader) {
                // References can be space-separated message IDs
                const referencesString = Array.isArray(referencesHeader) ? referencesHeader.join(' ') : referencesHeader;
                references = referencesString.split(/\s+/).filter((ref: string) => ref.trim().length > 0);
              }
              
              const emailMessage: EmailMessage = {
                id: attributes.uid?.toString() || seqno.toString(),
                from: senderInfo.email,
                fromName: senderInfo.name,
                to: cleanToAddresses,
                cc: cleanCcAddresses.length > 0 ? cleanCcAddresses : undefined,
                subject: subject,
                body: body,
                date: parsed.date || new Date(),
                read: attributes.flags?.includes('\\Seen') || false,
                attachments: parsed.attachments?.map(att => ({
                  filename: att.filename || 'unknown',
                  contentType: att.contentType,
                  size: att.size || 0,
                })),
                category: categorizeEmail(senderInfo.email, subject, body),
                // Threading fields
                messageId: messageId,
                inReplyTo: inReplyTo,
                references: references.length > 0 ? references : undefined,
              };

              console.log('Processed email message:', {
                id: emailMessage.id,
                uid: attributes.uid,
                seqno: seqno,
                from: emailMessage.from,
                to: emailMessage.to,
                cc: emailMessage.cc,
                subject: emailMessage.subject,
                read: emailMessage.read
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
    
    // Group emails into threads
    const threads = groupEmailsIntoThreads(emails);

    return NextResponse.json({
      success: true,
      emails,
      threads,
      count: emails.length,
      threadCount: threads.length,
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
