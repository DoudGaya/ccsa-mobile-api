# Gmail SMTP Setup Guide for CCSA Email Verification

This guide will help you set up Gmail SMTP for sending real email verification messages in your CCSA application.

## Prerequisites

- A Gmail account
- 2-Factor Authentication enabled on your Gmail account
- Access to your project's `.env.local` file

## Step 1: Enable 2-Factor Authentication (2FA)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click "2-Step Verification"
3. Follow the setup process if 2FA is not already enabled
4. **Note**: App Passwords are only available when 2FA is enabled

## Step 2: Generate Gmail App Password

1. Stay in [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click "App passwords"
   - If you don't see this option, make sure 2FA is enabled
3. In the "Select app" dropdown, choose "Mail"
4. In the "Select device" dropdown, choose "Other (custom name)"
5. Enter a custom name: `CCSA Application`
6. Click "Generate"
7. **Important**: Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
8. Save this password securely - you won't be able to see it again

## Step 3: Update Environment Variables

1. Open your `.env.local` file in the project root
2. Find the email configuration section (around line 58-61)
3. Update the following variables with your actual credentials:

```bash
# Email Configuration (Required for email verification)
EMAIL_SERVICE="gmail"
EMAIL_USER="your-actual-email@gmail.com"          # Replace with your Gmail address
EMAIL_PASSWORD="your-16-character-app-password"    # Replace with the App Password from Step 2
FRONTEND_URL="http://localhost:3000"               # Update if using different URL
```

### Example Configuration:
```bash
EMAIL_SERVICE="gmail"
EMAIL_USER="ccsa.admin@gmail.com"
EMAIL_PASSWORD="abcd efgh ijkl mnop"
FRONTEND_URL="http://localhost:3000"
```

## Step 4: Restart Your Application

After updating the environment variables, restart your Next.js application:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Step 5: Test Email Verification

1. Create a new agent through the admin interface or API
2. Check the server console logs for email sending confirmation
3. Check the recipient's email inbox for the activation email
4. Test the activation link to ensure it works properly

## Expected Email Output

When properly configured, creating a new agent should:

1. **Console Log**: Show actual email sending (not simulation):
   ```
   ✅ Agent activation email sent to: agent@example.com
   ```

2. **Email Received**: The agent should receive an email with:
   - Subject: "Welcome to CCSA - Activate Your Agent Account"
   - Professional HTML formatting
   - Working activation link
   - Instructions for next steps

## Troubleshooting

### Problem: "Invalid login" or authentication errors
**Solution**: 
- Ensure you're using an App Password (not your regular Gmail password)
- Verify 2FA is enabled on your Gmail account
- Double-check the email address and app password are correct

### Problem: Email not received
**Solution**:
- Check spam/junk folder
- Verify the EMAIL_USER is correct
- Check server console for error messages
- Ensure firewall/network allows SMTP connections

### Problem: Still seeing simulation messages
**Solution**:
- Verify `.env.local` file is in the correct location (project root)
- Restart the development server after making changes
- Check that EMAIL_USER and EMAIL_PASSWORD are not empty

### Problem: "Less secure app access" error
**Solution**:
- Use App Passwords instead of enabling "less secure app access"
- App Passwords are more secure and the recommended approach

## Security Best Practices

1. **Never commit** your `.env.local` file to version control
2. **Use App Passwords** instead of your main Gmail password
3. **Rotate App Passwords** periodically for security
4. **Limit permissions** by creating a dedicated Gmail account for the application
5. **Monitor email usage** to detect any unusual activity

## Production Deployment

For production deployment:

1. **Use environment-specific variables**:
   ```bash
   FRONTEND_URL="https://your-production-domain.com"
   ```

2. **Consider using a dedicated email service** like:
   - SendGrid
   - Mailgun
   - Amazon SES
   - Postmark

3. **Set up proper DNS records** (SPF, DKIM, DMARC) for better deliverability

## Testing Checklist

- [ ] 2FA enabled on Gmail account
- [ ] App Password generated and saved
- [ ] Environment variables updated in `.env.local`
- [ ] Application restarted
- [ ] Test agent creation sends real email
- [ ] Email received with proper formatting
- [ ] Activation link works correctly
- [ ] No simulation messages in console

## Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify all environment variables are correctly set
3. Test with a different email address
4. Ensure network connectivity allows SMTP connections
5. Review Google's App Password documentation

---

**Note**: Keep your App Password secure and never share it publicly. Treat it like a regular password.
