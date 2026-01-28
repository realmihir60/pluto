# Pluto Health - Troubleshooting Guide

Common issues and their solutions for Pluto Health deployment and development.

---

## 🔥 Critical Issues

### Issue: "Call 911" Disclaimer Not Showing
**Symptoms:**  
Emergency triage responses don't show proper disclaimers

**Solution:**
1. Check `api/triage.py` crisis keyword detection
2. Verify frontend displays `disclaimer` field from API response
3. Test with crisis keywords: "can't breathe", "chest pain crushing", "worst headache ever"

---

### Issue: Rate Limit Not Working / Users Can Spam Requests
**Symptoms:**  
Users can make unlimited requests, no 429 errors

**Root Cause:**  
Rate limiter not integrated into API endpoints

**Solution:**
Follow `INTEGRATION_GUIDE.md` to add rate limiter to `api/triage.py`:
```python
from python_core.rate_limiter import get_rate_limiter

rate_limiter = get_rate_limiter()
rate_limiter.check_limit(user_id_or_ip, is_authenticated=bool(user))
```

---

### Issue: No Error Logs Being Generated
**Symptoms:**  
`/logs/` directory empty or doesn't exist

**Root Cause:**  
Logger not integrated into endpoints

**Solution:**
```python
# Add to api/triage.py
from python_core.logger import get_logger

logger = get_logger()
logger.log_error("error_type", "message", {"context": "data"})
```

Create logs directory manually if needed:
```bash
mkdir -p logs
chmod 755 logs
```

---

## 🐛 Backend/API Issues

### Issue: "Prisma Client Not Initialized"
**Error:**  
`PrismaClientInitializationError` or "prisma generate not run"

**Solution:**
```bash
# Generate Prisma client
npx prisma generate

# If still failing, delete and regenerate
rm -rf node_modules/.prisma
npm install
npx prisma generate
```

---

### Issue: "Database Connection Failed"
**Error:**  
`P1001: Can't reach database server`

**Solutions:**

**1. Check DATABASE_URL format:**
```env
# Wrong (direct connection)
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Correct (with pgbouncer)
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true"
```

**2. Verify database is running:**
```bash
# For Neon/Supabase, check dashboard
# For local Postgres:
psql $DATABASE_URL
```

**3. Check firewall/IP allowlist:**
- Vercel IPs change frequently
- Use connection pooler instead of direct connection

---

### Issue: "Groq API Key Invalid"
**Error:**  
`401 Unauthorized` from Groq API

**Solution:**
```bash
# Verify API key is set
echo $GROQ_API_KEY

# Test API key directly
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"

# Should return list of models
```

Get a new key: https://console.groq.com/keys

---

### Issue: "ModuleNotFoundError: No module named 'python_core'"
**Error:**  
Python can't find `python_core` package

**Solution:**
```bash
# Check you're in the right directory
pwd  # Should be in /Users/.../pluto-landing-page

# Check python_core exists
ls python_core/

# If using virtual environment, activate it
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

---

### Issue: Triage Returns "Internal Server Error" (500)
**Symptoms:**  
All triage requests fail with 500 error

**Debugging Steps:**

**1. Check backend logs:**
```bash
# Terminal running python3 main_api.py
# Look for traceback
```

**2. Check error logs:**
```bash
cat logs/errors.jsonl | tail -10
```

**3. Test with minimal input:**
```bash
curl -X POST http://localhost:8000/api/triage \
  -H "Content-Type: application/json" \
  -d '{"input":"test"}'
```

**4. Check Groq API status:**
https://status.groq.com

---

## 🖥️ Frontend Issues

### Issue: "NEXT_PUBLIC_API_URL is undefined"
**Symptoms:**  
Frontend can't reach backend, API calls fail

**Solution:**
```bash
# Add to .env
NEXT_PUBLIC_API_URL=http://localhost:8000

# Restart Next.js dev server
# Ctrl+C, then npm run dev
```

---

### Issue: "Hydration Error" in Console
**Error:**  
React hydration mismatch

**Cause:**  
Server-rendered HTML doesn't match client-rendered HTML

**Solutions:**
```tsx
// Use useEffect for client-only code
useEffect(() => {
  // Client-only logic here
}, [])

// Or use dynamic import with ssr: false
const ClientOnlyComponent = dynamic(() => import('./Component'), {
  ssr: false  
})
```

---

### Issue: Demo Page Not Loading / Blank Screen
**Symptoms:**  
`/demo` route shows blank page

**Debugging:**
```bash
# Check console for errors
# Open browser DevTools → Console

# Common causes:
# 1. Missing environment variable
# 2. API not running
# 3. JavaScript error
```

**Solution:**
```bash
# Restart frontend
# Ctrl+C in terminal running `npm run dev`
npm run dev

# Clear browser cache
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

---

## 📧 Email/Authentication Issues

### Issue: Email Verification Not Sending
**Symptoms:**  
Users sign up but never get verification email

**Solution:**
```bash
# Check .env has Gmail credentials
GMAIL_USER=yourapp@gmail.com
GMAIL_APP_PASSWORD=your_16_char_password

# Test Gmail SMTP
node -e "console.log(process.env.GMAIL_USER, process.env.GMAIL_APP_PASSWORD)"

# Check app/api/send-verification/route.ts is using Gmail
# (not console.log)
```

Generate Gmail App Password:
1. Google Account → Security
2. 2-Step Verification (must be enabled)
3. App Passwords → Generate

---

### Issue: "Invalid Credentials" on Login
**Symptoms:**  
Users can't log in even with correct password

**Solutions:**

**1. Check password hashing:**
```bash
# In database, passwords should be hashed (start with $2b$)
# Not plain text
```

**2. Verify AUTH_SECRET is set:**
```bash
echo $AUTH_SECRET
# Should be a long random string
```

**3. Check session storage:**
```sql
-- In database
SELECT * FROM "Session" WHERE "userId" = 'user_id_here';
```

---

## ⚡ Performance Issues

### Issue: Triage Takes >5 Seconds to Respond
**Symptoms:**  
Slow API responses, timeout errors

**Debugging:**
```bash
# Check performance logs
cat logs/performance.jsonl | jq '.duration_ms' | awk '{sum+=$1; count++} END {print sum/count "ms avg"}'
```

**Solutions:**

**1. Check Groq API latency:**
```bash
time curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**2. Optimize prompt size:**
- Reduce clinical_protocols.json size
- Limit context sent to LLM

**3. Use faster model:**
```python
# In api/triage.py
model="llama-3.3-70b-versatile"  # Current
# vs
model="llama-3.1-8b-instant"  # Faster, less accurate
```

---

## 🔐 Security Issues

### Issue: .env File Committed to Git
**Symptoms:**  
Secrets exposed in GitHub repository

**Emergency Fix:**
```bash
# 1. Remove from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 2. Force push (WARNING: Destructive)
git push origin --force --all

# 3. Rotate ALL secrets immediately
# - Generate new AUTH_SECRET
# - Get new Groq API key
# - Change database password

# 4. Add to .gitignore (if not already)
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
git push
```

---

 ## 📊 Monitoring Issues

### Issue: Admin Metrics Not Showing Data
**Symptoms:**  
`/api/admin/metrics` returns empty stats

**Solution:**
```bash
# 1. Check logs directory exists
ls -la logs/

# 2. Check log files have data
wc -l logs/*.jsonl

# 3. Verify logger is being used
grep "logger.log" api/triage.py api/chat.py

# 4. Test manual logging
python3 -c "
from python_core.logger import get_logger
logger = get_logger()
logger.log_error('test', 'Test error')
print('Check logs/errors.jsonl')
"
```

---

## 🚀 Deployment Issues

### Issue: Vercel Build Fails
**Error:**  
`Build failed` in Vercel dashboard

**Common Causes:**

**1. TypeScript errors:**
```bash
# Run locally
npm run build

# Fix any TypeScript errors shown
```

**2. Missing environment variables:**
```bash
# Check Vercel → Settings → Environment Variables
# All vars from .env.example should be set
```

**3. Prisma issues:**
```bash
# Add to package.json if not present
"scripts": {
  "postinstall": "prisma generate"
}
```

---

### Issue: Vercel Functions Timeout
**Error:**  
`Function execution timed out after 10s`

**Solutions:**

**1. Optimize for Hobby plan (10s limit):**
- Reduce LLM prompt size
- Use faster models
- Add caching

**2. Upgrade to Pro plan (60s limit):**
- Vercel.com → Upgrade

**3. Add timeout handling:**
```python
import asyncio

try:
    result = await asyncio.wait_for(
        long_running_function(),
        timeout=8.0  # 8s to leave 2s buffer
    )
except asyncio.TimeoutError:
    # Return partial result or error
    return fallback_response()
```

---

## 🆘 Emergency Contacts

**Backend Issues:**  
Check `api/*/route.py` files and Python console output

**Frontend Issues:**  
Check browser DevTools console and Network tab

**Database Issues:**  
Check Neon/Supabase dashboard

**API Issues:**  
Check Groq status: https://status.groq.com

---

## 🔍 Debug Mode

Enable detailed logging:

```bash
# Backend
export DEBUG=True
python3 main_api.py

# Frontend
NEXT_PUBLIC_DEBUG=true npm run dev
```

---

**Still stuck?** Check the [integration guide](./INTEGRATION_GUIDE.md) or [beta launch summary](./beta_launch_summary.md).
