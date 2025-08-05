# 📧 Gmail SMTP Quick Setup Reference

## 🚀 Quick Steps

### 1. Enable 2FA in Gmail
- Go to [Google Account Security](https://myaccount.google.com/security)
- Enable "2-Step Verification" under "Signing in to Google"

### 2. Generate App Password
- Still in Google Account Security
- Click "App passwords" under "Signing in to Google"
- Select "Mail" app, "Other (custom name)" device
- Name it "CCSA Application"
- Copy the 16-character password

### 3. Update .env.local
```bash
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-16-char-app-password"
FRONTEND_URL="http://localhost:3000"
```

### 4. Restart & Test
```bash
npm run dev
npm run test:email  # Optional: Test configuration
```

## 🔍 Status Check

### ❌ Simulation Mode (Email not configured)
```
📧 [SIMULATED] Agent activation email: { ... }
```

### ✅ Real Email Mode (Email configured)
```
✅ Agent activation email sent to: agent@example.com
```

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid login" | Use App Password, not regular password |
| Email not received | Check spam folder, verify EMAIL_USER |
| Still showing simulation | Restart server, check .env.local |

## 📋 Quick Test
1. Create new agent in admin panel
2. Check console logs for email status
3. Check recipient's email inbox
4. Test activation link

## 🔒 Security Notes
- Never commit .env.local to git
- Use App Passwords only
- Rotate passwords periodically
- Monitor email usage

---
**Need help?** Check `GMAIL_SMTP_SETUP.md` for detailed instructions.
