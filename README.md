# Resend Email Worker

A Cloudflare Worker built with Hono and Resend for sending emails using React email templates.

## Features

- ✉️ Send emails using Resend API
- ⚛️ React-based email templates
- 🚀 Cloudflare Workers for edge deployment
- 🔧 Local development with hot reloading
- 📝 TypeScript support
- 🎨 HTML email rendering

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (package manager)
- **Resend API Key** (get one from [resend.com](https://resend.com))

### Install pnpm

If you don't have pnpm installed:

```bash
# Using npm
npm install -g pnpm

# Or using curl (Unix/macOS)
curl -fsSL https://get.pnpm.io/install.sh | sh

# Or using PowerShell (Windows)
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repository-url>
cd resend-email-worker

# Install dependencies
pnpm install
```

### 2. Environment Setup

Create a `.dev.vars` file in the root directory for local development:

```bash
# Create .dev.vars file
touch .dev.vars
```

Add your Resend API key to `.dev.vars`:

```env
RESEND_API_KEY=re_your_actual_resend_api_key_here
```

> ⚠️ **Important**: Never commit `.dev.vars` to version control. It's already included in `.gitignore`.

### 3. Configure Email Sender (Optional)

Update the `DEFAULT_FROM` email in `wrangler.toml`:

```toml
[vars]
DEFAULT_FROM = "Your App Name <noreply@yourdomain.com>"
```

### 4. Start Local Development

```bash
# Start the development server
pnpm dev
```

The server will start at `http://localhost:8787` 🎉

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start local development server (offline mode) |
| `pnpm run dev:remote` | Start development server connected to Cloudflare |
| `pnpm run type-check` | Run TypeScript type checking |
| `pnpm build` | Build the project (dry run) |
| `pnpm deploy` | Deploy to Cloudflare Workers |

## 🧪 Testing the API

### Health Check

```bash
curl http://localhost:8787/health
```

Expected response: `ok`

### Send Email

```bash
curl -X POST http://localhost:8787/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Welcome to Our App!",
    "firstName": "John"
  }'
```

Expected response:
```json
{
  "id": "resend_email_id_here"
}
```

### Send to Multiple Recipients

```bash
curl -X POST http://localhost:8787/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["user1@example.com", "user2@example.com"],
    "subject": "Newsletter",
    "firstName": "Team"
  }'
```

## 📁 Project Structure

```
resend-email-worker/
├── src/
│   ├── index.ts              # Main application file
│   └── emails/
│       └── EmailTemplate.tsx # React email template
├── .dev.vars                 # Local environment variables (not in git)
├── .pnpmrc                   # pnpm configuration
├── wrangler.toml             # Cloudflare Workers configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Project dependencies and scripts
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `RESEND_API_KEY` | Your Resend API key | ✅ Yes | - |
| `DEFAULT_FROM` | Default sender email | No | `"Acme <onboarding@resend.dev>"` |

### Local Development vs Production

- **Local Development**: Uses `.dev.vars` file and runs completely offline
- **Production**: Uses Cloudflare Workers secrets and environment variables

## 🎨 Customizing Email Templates

The email template is located at `src/emails/EmailTemplate.tsx`. You can customize it by:

1. **Editing the existing template**:
   ```tsx
   const EmailTemplate: FC<EmailTemplateProps> = ({ firstName }) => {
     return (
       <html>
         <body>
           <h1>Hello, {firstName}!</h1>
           {/* Add your custom content here */}
         </body>
       </html>
     );
   };
   ```

2. **Adding new props** to the `EmailTemplateProps` interface:
   ```tsx
   export interface EmailTemplateProps {
     firstName: string;
     companyName?: string;
     // Add more props as needed
   }
   ```

3. **Using inline styles** for better email client compatibility (already implemented).

## 🚚 Deployment

### Deploy to Cloudflare Workers

1. **Set up production secrets**:
   ```bash
   wrangler secret put RESEND_API_KEY
   # Enter your Resend API key when prompted
   ```

2. **Deploy the worker**:
   ```bash
   pnpm deploy
   ```

3. **Your worker will be available at**:
   ```
   https://resend-email-worker.your-subdomain.workers.dev
   ```

## 🐛 Troubleshooting

### Common Issues

**1. "Missing RESEND_API_KEY" error**
- Make sure `.dev.vars` file exists and contains your API key
- Verify the API key is valid on [resend.com](https://resend.com)

**2. TypeScript errors**
```bash
# Run type checking
pnpm run type-check
```

**3. Email not sending**
- Check your Resend API key is correct
- Verify the sender email domain is verified in Resend
- Check the console logs for detailed error messages

**4. Port already in use**
```bash
# Kill process using port 8787
lsof -ti:8787 | xargs kill -9

# Or use a different port
pnpm dev -- --port 3000
```

**5. Module resolution issues**
```bash
# Clear pnpm cache and reinstall
pnpm store prune
rm -rf node_modules
pnpm install
```

### Development Tips

- **Hot Reloading**: The development server automatically restarts when you make changes
- **Logs**: Check the terminal for detailed error messages and request logs
- **Email Testing**: Use services like [Mailtrap](https://mailtrap.io) or [MailHog](https://github.com/mailhog/MailHog) for testing

## 📚 API Reference

### POST `/send`

Send an email using the configured template.

**Request Body:**
```typescript
{
  to: string | string[];    // Recipient email(s)
  subject: string;          // Email subject
  firstName: string;        // Recipient's first name
}
```

**Response:**
```typescript
// Success
{
  id: string;              // Resend email ID
}

// Error
{
  error: string;           // Error message
}
```

**Status Codes:**
- `200` - Email sent successfully
- `400` - Invalid request or email sending failed
- `500` - Server error (missing API key)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run type checking: `pnpm run type-check`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Resources

- [Resend Documentation](https://resend.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Hono Documentation](https://hono.dev/)
- [React Email Documentation](https://react.email/)
- [pnpm Documentation](https://pnpm.io/)

---

**Happy coding!** 🎉 If you have any questions or issues, please open an issue on GitHub.