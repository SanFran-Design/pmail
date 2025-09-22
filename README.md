# PMail - Personal Email Client

A modern, responsive email client built with Next.js that supports Gmail SMTP/IMAP and can be extended to work with other email providers.

## Features

- 📧 Send and receive emails using Gmail (or other SMTP/IMAP servers)
- 📱 Responsive design - works on both desktop and mobile devices
- 🔒 Secure credential storage (local storage for development)
- 🚀 Easy deployment with Next.js
- 🎨 Modern UI with Tailwind CSS
- ⚡ Real-time email fetching and sending

## Prerequisites

- Node.js 18+ 
- A Gmail account with App Passwords enabled (for Gmail integration)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Gmail App Passwords (for Gmail users)

To use Gmail with this client, you'll need to set up App Passwords:

1. Enable 2-Factor Authentication on your Google account
2. Go to [Google Account Settings](https://myaccount.google.com/)
3. Navigate to Security > App Passwords
4. Generate a new App Password for "Mail"
5. Use this App Password (not your regular password) in the email client

### 3. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Configure Your Email Account

1. Click "Configure Email Account" on the welcome screen
2. Select your email provider (Gmail by default)
3. Enter your email address
4. Enter your App Password (for Gmail) or regular password (for other providers)
5. Optionally, enter a display name
6. Click "Save & Connect"

The app will test the connection and save your configuration locally.

## Usage

### Sending Emails

1. Click the "Compose" button
2. Fill in recipient, subject, and message
3. Click "Send"

### Receiving Emails

- Emails are automatically fetched when you first configure your account
- Click the "Refresh" button to fetch new emails
- Click on any email in the inbox to view its contents

### Managing Accounts

- Click the settings (gear) icon to reconfigure your email account
- Your credentials are stored locally in your browser

## Deployment

### Vercel (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket)
2. Connect your repository to [Vercel](https://vercel.com)
3. Deploy with default settings

### Docker

```bash
# Build the image
docker build -t pmail .

# Run the container
docker run -p 3000:3000 pmail
```

### Traditional Hosting

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## Supported Email Providers

Currently configured providers:

- **Gmail** - smtp.gmail.com / imap.gmail.com
- **Outlook** - smtp-mail.outlook.com / outlook.office365.com  
- **Yahoo** - smtp.mail.yahoo.com / imap.mail.yahoo.com

### Adding Custom Providers

You can add custom SMTP/IMAP servers by modifying the `EMAIL_PROVIDERS` configuration in `src/lib/email-config.ts`.

## Security Considerations

- **Development**: Credentials are stored in browser localStorage
- **Production**: Consider implementing proper authentication and encrypted credential storage
- **Gmail**: Always use App Passwords, never your main password
- **Network**: All email connections use TLS/SSL encryption

## File Structure

```
src/
  app/
    api/email/          # API routes for email operations
    globals.css         # Global styles
    layout.tsx         # App layout
    page.tsx           # Main email client page
  components/          # React components
    EmailList.tsx      # Email list component
    ComposeModal.tsx   # Email composition modal
    EmailConfigModal.tsx # Email configuration modal
  lib/
    email-config.ts    # Email provider configurations
  types/
    email.ts           # TypeScript type definitions
```

## API Routes

- `POST /api/email/send` - Send emails via SMTP
- `POST /api/email/fetch` - Fetch emails via IMAP
- `POST /api/email/test` - Test SMTP/IMAP connections

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this for personal or commercial projects.

## Support

If you encounter issues:

1. Check that your email credentials are correct
2. Verify that App Passwords are enabled (for Gmail)
3. Ensure your network allows SMTP/IMAP connections
4. Check the browser console for error messages

For Gmail specifically, make sure:
- 2FA is enabled on your account
- You're using an App Password, not your regular password
- Less secure app access is not required (App Passwords bypass this)
