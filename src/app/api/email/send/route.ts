import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { SMTPConfig, ComposeEmail } from '@/types/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailData, smtpConfig }: { emailData: ComposeEmail; smtpConfig: SMTPConfig } = body;

    console.log('Email send request received:', {
      to: emailData?.to,
      subject: emailData?.subject,
      hasSmtpConfig: !!smtpConfig,
      smtpHost: smtpConfig?.host
    });

    // Validate input
    if (!emailData.to || !emailData.subject || !smtpConfig) {
      const missingFields = [];
      if (!emailData.to) missingFields.push('recipient');
      if (!emailData.subject) missingFields.push('subject');
      if (!smtpConfig) missingFields.push('SMTP configuration');
      
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
    });

    // Verify connection
    try {
      console.log('Verifying SMTP connection to:', smtpConfig.host);
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (error) {
      console.error('SMTP connection failed:', error);
      
      let connectionError = 'Failed to connect to email server. Please check your credentials.';
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('invalid login') || errorMsg.includes('authentication')) {
          connectionError = 'Authentication failed. Please verify your email and App Password are correct.';
        } else if (errorMsg.includes('connection') || errorMsg.includes('enotfound')) {
          connectionError = 'Cannot reach email server. Please check your internet connection.';
        } else if (errorMsg.includes('timeout')) {
          connectionError = 'Connection timeout. Email server may be temporarily unavailable.';
        }
      }
      
      return NextResponse.json(
        { error: connectionError },
        { status: 401 }
      );
    }

    // Prepare email options
    const mailOptions = {
      from: smtpConfig.auth.user,
      to: emailData.to,
      cc: emailData.cc || undefined,
      bcc: emailData.bcc || undefined,
      subject: emailData.subject,
      text: emailData.body,
      html: emailData.body.replace(/\n/g, '<br>'), // Simple HTML conversion
    };

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasBody: !!mailOptions.text
    });

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      response: info.response
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send email';
    
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('invalid login') || errorMsg.includes('authentication failed')) {
        errorMessage = 'Authentication failed. Please check your email and App Password.';
      } else if (errorMsg.includes('connection') || errorMsg.includes('connect')) {
        errorMessage = 'Cannot connect to email server. Please check your internet connection.';
      } else if (errorMsg.includes('timeout')) {
        errorMessage = 'Email server timeout. Please try again.';
      } else if (errorMsg.includes('recipient') || errorMsg.includes('to address')) {
        errorMessage = 'Invalid recipient email address.';
      } else if (errorMsg.includes('quota') || errorMsg.includes('limit')) {
        errorMessage = 'Email sending limit reached. Please try again later.';
      } else {
        errorMessage = `Email sending failed: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
