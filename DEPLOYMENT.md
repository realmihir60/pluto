# Pluto Health - Deployment Guide

## 🚀 Deploying to Vercel

### Prerequisites
- Vercel account (free tier works)
- GitHub repository with latest code
- PostgreSQL database (Neon.tech or Supabase recommended)
- Groq API key

---

## Step-by-Step Deployment

### 1. Prepare Database

**Using Neon.tech (Recommended):**
```bash
# 1. Go to https://neon.tech
# 2. Create a new project
# 3. Copy the connection string (pooled connection)
# 4. Note both DATABASE_URL and DIRECT_URL
```

**Using Supabase:**
```bash
# 1. Go to https://supabase.com
# 2. Create a new project
# 3. Go to Settings → Database
# 4. Copy Connection pooler (Transaction mode) URL
```

---

### 2. Set Up Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project (run from project root)
vercel link

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? pluto-health (or your choice)
# - Directory? ./
```

---

### 3. Configure Environment Variables

**In Vercel Dashboard:**

1. Go to your project → Settings → Environment Variables
2. Add the following (use `.env.example` as reference):

```env
# Required
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
DATABASE_URL=postgresql://user:pass@host/db?pgbouncer=true
DIRECT_URL=postgresql://user:pass@host/db
AUTH_SECRET=your_64_character_secret_here

# Optional (for email)
GMAIL_USER=yourapp@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
ADMIN_EMAIL=admin@yourapp.com

# Auto-set by Vercel (no action needed)
NEXT_PUBLIC_API_URL=auto_detected
```

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 48
# Copy output and use as AUTH_SECRET
```

---

### 4. Database Migration

**Push Prisma schema to production DB:**
```bash
# Set production database URL temporarily
export DATABASE_URL="your_production_database_url"
export DIRECT_URL="your_production_direct_url"

# Push schema
npx prisma db push

# Verify
npx prisma studio
# Check that all tables exist
```

---

### 5. Deploy to Vercel

```bash
# Deploy to preview
vercel

# After testing preview, deploy to production
vercel --prod
```

**Vercel will:**
1. Install Node.js dependencies
2. Run Prisma generate
3. Build Next.js app
4. Deploy FastAPI Python functions to serverless

---

### 6. Verify Deployment

**Check these endpoints:**

1. **Homepage:**
   ```
   https://your-app.vercel.app
   ```

2. **API Health:**
   ```
   https://your-app.vercel.app/api/admin/metrics/health
   ```
   Should return: `{"status": "ok", ...}`

3. **Triage API:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/triage \
     -H "Content-Type: application/json" \
     -d '{"input":"headache"}'
   ```
   Should return triage JSON (or rate limit if not authenticated)

---

### 7. Post-Deployment Checklist

- [ ] Homepage loads correctly
- [ ] Sign up flow works (email verification)
- [ ] Login works
- [ ] Demo triage returns results
- [ ] Admin dashboard accessible (for admin users)
- [ ] Logs directory created (`/logs/`)
- [ ] Rate limiting active (test with rapid requests)
- [ ] Error tracking working (check `/logs/errors.jsonl`)

---

## 🔒 Security Checklist

Before going public:

- [ ] Rotate `AUTH_SECRET` (use new value, not from .env)
- [ ] Verify `.env` is in `.gitignore`
- [ ] Check no secrets in git history
- [ ] Enable Vercel password protection (Settings → Deployment Protection)
- [ ] Set up custom domain with SSL
- [ ] Review Privacy Policy and Terms of Service
- [ ] Test rate limiting (should block after limits)

---

## 📊 Monitoring

### View Logs (Vercel Dashboard)
1. Go to your project → Deployments
2. Click latest deployment
3. Click "Runtime Logs"
4. Filter by function: `api/triage`, `api/chat`

### View In-House Logs
Access via SFTP to `/logs/` directory:
- `errors.jsonl` - All errors
- `triage.jsonl` - Triage events
- `performance.jsonl` - API performance
- `access.jsonl` - Access logs

### Admin Metrics
Access: `https://your-app.vercel.app/api/admin/metrics`
(Requires admin authentication)

---

## 🐛 Common Deployment Issues

### Issue: "Prisma Client Not Found"
**Solution:**
```bash
# Add to package.json scripts
"postinstall": "prisma generate"
```
Vercel runs this automatically.

### Issue: "Database Connection Failed"
**Solution:**
- Verify `DATABASE_URL` has `?pgbouncer=true`
- Check IP allowlist in database settings (Vercel IPs change)
- Use connection pooler, not direct connection

### Issue: "Python Function Timeout"
**Solution:**
- Vercel has 10s timeout on Hobby plan, 60s on Pro
- Optimize triage logic
- Add timeout handling in code

### Issue: "Rate Limit Not Working"
**Solution:**
- Rate limiter uses in-memory storage
- Each Vercel function instance has separate memory
- For distributed rate limiting, use Vercel KV (Redis)

---

## 🔄 Continuous Deployment

**Auto-deploy on git push:**

1. Connect GitHub repo in Vercel dashboard
2. Enable "Production Branch": `main`
3. Enable "Preview Branches": All branches
4. Every push to `main` → Auto-deploy to production
5. Every PR → Preview deployment with unique URL

---

## 📈 Scaling Considerations

### Hobby Plan (Free)
- 100GB bandwidth/month
- 100 hours serverless function execution
- **Good for:** 1,000-5,000 triage requests/month

### Pro Plan ($20/month)
- 1TB bandwidth
- 1,000 hours serverless execution
- **Good for:** 50,000+ triage requests/month

### Database Scaling
- **Neon Free:** 3 GB storage, 100 hours compute
- **Neon Pro:** $19/month, 10 GB storage, unlimited compute
- **Supabase Free:** 500 MB, 2 GB bandwidth
- **Supabase Pro:** $25/month, 8 GB storage

---

## 🚦 Deployment Stages

### Stage 1: Staging
```bash
# Deploy to staging branch
vercel --scope your-account

# Test thoroughly
# Get preview URL: https://pluto-health-xyz.vercel.app
```

### Stage 2: Soft Launch
```bash
# Deploy to production
vercel --prod

# Enable password protection
# Invite 10-20 beta testers
# Monitor for 1 week
```

### Stage 3: Public Launch
```bash
# Remove password protection
# Announce on social media
# Monitor closely for first 48 hours
```

---

## 📞 Emergency Rollback

If something breaks in production:

```bash
# List recent deployments
vercel ls

# Promote previous deployment to production
vercel promote <deployment-url>

# Or via dashboard:
# Deployments → Click previous deployment → Promote to Production
```

---

## ✅ Final Pre-Launch Checklist

- [ ] All environment variables set in Vercel
- [ ] Database schema migrated
- [ ] Test deployment in preview
- [ ] Verify all API endpoints work
- [ ] Check error tracking is writing to `/logs/`
- [ ] Test rate limiting
- [ ] Verify email verification works
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Analytics/monitoring configured
- [ ] Backup strategy in place (database snapshots)

---

**Ready to deploy!** 🚀

For issues, check `TROUBLESHOOTING.md` or contact Vercel support.
