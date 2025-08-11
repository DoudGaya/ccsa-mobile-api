# CCSA Mobile API - Production Deployment

## Production Build & Deployment

### Prerequisites
1. Node.js 18+ installed
2. Database connection configured
3. All environment variables set
4. Production domain configured

### Quick Deploy
```bash
# Make deploy script executable
chmod +x scripts/deploy.js

# Run production deployment
node scripts/deploy.js
```

### Manual Deployment Steps

1. **Environment Setup**
   ```bash
   export NODE_ENV=production
   ```

2. **Clean Previous Build**
   ```bash
   rm -rf .next dist build node_modules/.cache
   ```

3. **Install Dependencies**
   ```bash
   npm ci
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. **Build Application**
   ```bash
   npm run build
   ```

6. **Start Production Server**
   ```bash
   npm start
   ```

### Production Environment Variables

Ensure these variables are set in production:

```bash
# Database
DATABASE_URL="your_production_database_url"

# Authentication
NEXTAUTH_SECRET="your_production_secret"
NEXTAUTH_URL="https://your-domain.com"

# Firebase
FIREBASE_PROJECT_ID="your_project_id"
FIREBASE_PRIVATE_KEY="your_private_key"
FIREBASE_CLIENT_EMAIL="your_client_email"

# External APIs
NIN_API_BASE_URL="https://e-nvs.digitalpulseapi.net"
NIN_API_KEY="your_nin_api_key"

# SMS
TWILIO_ACCOUNT_SID="your_twilio_sid"
TWILIO_AUTH_TOKEN="your_twilio_token"
TWILIO_VERIFY_SERVICE_SID="your_verify_service_sid"

# Email
SMTP_HOST="your_smtp_host"
SMTP_PORT=587
SMTP_USER="your_smtp_user"
SMTP_PASS="your_smtp_password"
```

### Deployment Platforms

#### Vercel
```bash
npm run vercel-build
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start npm --name "ccsa-api" -- start
pm2 startup
pm2 save
```

### Production Optimizations Applied

- ✅ Removed all debug/test files
- ✅ Cleaned console.log statements  
- ✅ Production logging configuration
- ✅ Environment-based logging levels
- ✅ Optimized build configuration
- ✅ Database connection pooling
- ✅ Error handling improvements

### Monitoring & Health Checks

- Health endpoint: `/api/health`
- Database status monitoring
- Connection pool monitoring
- Error logging in production

### Security Considerations

- Authentication middleware applied
- CORS configured
- Rate limiting implemented
- Input validation on all endpoints
- Environment variables secured
