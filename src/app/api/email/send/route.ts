import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { SMTPConfig, ComposeEmail } from '@/types/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailData, smtpConfig }: { emailData: ComposeEmail; smtpConfig: SMTPConfig } = body;

    // Validate input
    if (!emailData.to || !emailData.subject || !smtpConfig) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransporter({
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
      await transporter.verify();
    } catch (error) {
      console.error('SMTP connection failed:', error);
      return NextResponse.json(
        { error: 'Failed to connect to email server. Please check your credentials.' },
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

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent:', info.messageId);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
