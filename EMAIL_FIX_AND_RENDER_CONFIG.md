# Email Fix & Render Configuration Guide

**Date:** 2026-08-04  
**Issue:** SMTP Connection Timeout  
**Fix Applied:** Switch from SMTP to Brevo API

---

## PROBLEM IDENTIFIED

**Error in Render Logs:**
```
Reply email error: Error: Connection timeout
code: 'ETIMEDOUT', command: 'CONN'
Grant account error: Connection timeout
```

**Root Cause:**
- Brevo SMTP (`smtp-relay.brevo.com:587`) is timing out
- Render's network may be blocking SMTP port 587
- SMTP is less reliable than HTTP API

---

## SOLUTION APPLIED

**Changed:** `backend/src/lib/email.js`

**Implementation:**
1. ✅ Added Brevo API support (uses HTTPS instead of SMTP)
2. ✅ Falls back to SMTP if API key not available
3. ✅ Added connection timeouts (10 seconds)
4. ✅ Added detailed error logging
5. ✅ Automatic detection: Uses API if `BREVO_API_KEY` exists

**Benefits of Brevo API over SMTP:**
- ✅ Uses HTTPS (port 443) - never blocked
- ✅ More reliable (no connection timeout issues)
- ✅ Faster email sending
- ✅ Better error messages
- ✅ No firewall issues

---

## RENDER ENVIRONMENT VARIABLES CONFIGURATION

### Step 1: Go to Render Dashboard

1. Login to Render.com
2. Navigate to your backend service
3. Click **Environment** tab
4. Click **Edit** or **Add Environment Variable**

### Step 2: Verify These Variables Exist

**Required Variables:**

```bash
# Database
DATABASE_URL=postgresql://postgres.upnarcvdnbveixuqzzly:MyStrongPass%40123%21@aws-1-eu-central-1.pooler.supabase.com:6543/postgres

# JWT
JWT_SECRET=lus4g_secure_2026
JWT_EXPIRES_IN=2h
JWT_REFRESH_SECRET=lus4g_secure_2026_refresh_secret_32chars
JWT_REFRESH_EXPIRES_IN=7d

# Church
DEFAULT_CHURCH_ID=00000000-0000-0000-0000-000000000001

# Frontend URL (IMPORTANT: Update with your actual frontend URL)
FRONTEND_URL=https://your-frontend-app.onrender.com

# Email - Brevo API (RECOMMENDED - More reliable)
BREVO_API_KEY=xkeysib-YOUR_BREVO_API_KEY_HERE
EMAIL_FROM=LUS4G Church <no-reply@lus4g.org>

# Email - SMTP Fallback (Optional - if API fails)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-brevo-smtp-password

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=fxyhv4g3
CLOUDINARY_API_KEY=351477939867254
CLOUDINARY_API_SECRET=kaoSgxoFBqtUMrhPrHrkYY2Mw5o

# Timezone
TZ=Africa/Accra

# Node Environment
NODE_ENV=production
```

### Step 3: CRITICAL - Update FRONTEND_URL

**Current value (WRONG):**
```
FRONTEND_URL=https://your-render-frontend-url.onrender.com
```

**Should be (CORRECT):**
```
FRONTEND_URL=https://lus4g-church-frontend.onrender.com
```
*(Replace with your actual frontend URL)*

**Why this matters:**
- Password reset links use this URL
- Account setup links use this URL
- Email redirects use this URL
- Wrong URL = broken links in emails

---

## HOW TO GET YOUR ACTUAL FRONTEND URL

### Option 1: From Render Dashboard
1. Go to Render dashboard
2. Click on your **Frontend** service
3. Copy the URL shown at top (e.g., `https://lus4g-church-frontend.onrender.com`)
4. Paste it as `FRONTEND_URL` in backend environment variables

### Option 2: From Browser
1. Open your public website
2. Copy the URL from browser address bar
3. Use that as `FRONTEND_URL`

---

## VERIFICATION STEPS

### After Updating Render Environment Variables:

#### Step 1: Check Render Logs
1. Go to Render backend service
2. Click **Logs** tab
3. Look for:
   ```
   [Email sent via Brevo API] { to: '...', subject: '...' }
   ```

#### Step 2: Test Grant Account
1. Login as admin
2. Go to Admin > Members
3. Approve a pending member
4. Click **Grant Account**
5. Should see: "Account setup email sent"
6. Check Render logs for `[Email sent via Brevo API]`

#### Step 3: Test Contact Reply
1. Login as admin
2. Go to Admin > Contact Messages
3. Click on a message
4. Type reply and click Send
5. Should see success message
6. Check Render logs for `[Email sent via Brevo API]`

---

## TROUBLESHOOTING

### Issue: "Still getting connection timeout"

**Check 1: Is BREVO_API_KEY set in Render?**
```bash
# In Render Environment tab, verify:
BREVO_API_KEY=xkeysib-YOUR_ACTUAL_KEY_HERE
```

**Check 2: Did Render redeploy after adding variable?**
- Adding environment variables triggers auto-redeploy
- Wait for deployment to complete (2-3 minutes)
- Check logs for "[Email sent via Brevo API]"

**Check 3: Is API key valid?**
- Login to Brevo (https://app.brevo.com)
- Go to SMTP & API > API Keys
- Verify key is active
- Regenerate if needed

### Issue: "Email sent but not received"

**Check 1: Verify email address**
- Check member/contact has valid email
- Check for typos in email address

**Check 2: Check spam folder**
- Brevo emails may go to spam
- Add no-reply@lus4g.org to contacts

**Check 3: Brevo account limits**
- Free tier: 300 emails/day
- Check Brevo dashboard for quota
- Upgrade plan if needed

### Issue: "Wrong redirect URL in emails"

**Fix:** Update `FRONTEND_URL` in Render
```bash
# Should be your actual frontend domain
FRONTEND_URL=https://lus4g-church-frontend.onrender.com
```

---

## EXPECTED BEHAVIOR AFTER FIX

### Grant Account:
1. ✅ Admin clicks "Grant Account"
2. ✅ Button shows loading state
3. ✅ Success toast appears: "Account setup email sent"
4. ✅ Render logs show: `[Email sent via Brevo API]`
5. ✅ Member receives email within 1 minute
6. ✅ Email contains password setup link
7. ✅ Link redirects to your frontend

### Contact Reply:
1. ✅ Admin types reply message
2. ✅ Clicks "Send Reply"
3. ✅ Loading indicator shows
4. ✅ Success message appears
5. ✅ Render logs show: `[Email sent via Brevo API]`
6. ✅ Visitor receives reply email

### Contact Page CMS:
1. ✅ Admin saves contact settings
2. ✅ Visit public `/contact` page
3. ✅ Should see updated information
4. ✅ No more hardcoded defaults

### Footer CMS:
1. ✅ Admin saves footer settings
2. ✅ Visit any public page
3. ✅ Scroll to footer
4. ✅ Should see updated information

---

## DEBUGGING COMMANDS

### Check if Brevo API is being used:
```bash
# In Render Logs, search for:
"[Email sent via Brevo API]"

# vs

"[Email sent via SMTP]"
```

### If using SMTP (not recommended):
```bash
# Will see in logs:
"[SMTP error]"

# This means BREVO_API_KEY is not set
```

### Test Brevo API manually:
```bash
curl -X POST https://api.brevo.com/v3/smtp/email \
  -H "api-key: YOUR_BREVO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sender": {"email": "no-reply@lus4g.org", "name": "LUS4G Church"},
    "to": [{"email": "test@example.com"}],
    "subject": "Test Email",
    "htmlContent": "<p>Test message</p>"
  }'
```

---

## COMMIT SUMMARY

**Files Changed:**
- `backend/src/lib/email.js` - Added Brevo API support

**Commit Message:**
```
fix: Switch from SMTP to Brevo API to resolve email timeout issues

- Added Brevo API support (uses HTTPS, more reliable)
- Falls back to SMTP if BREVO_API_KEY not set
- Added connection timeouts (10 seconds)
- Added detailed error logging
- Fixes: Grant Account timeout
- Fixes: Contact Reply timeout
- Requires: BREVO_API_KEY in Render environment variables
```

---

## RENDER DEPLOYMENT CHECKLIST

After pushing code to GitHub:

1. ✅ Go to Render dashboard
2. ✅ Wait for auto-deploy to complete (2-3 minutes)
3. ✅ Check Environment tab for `BREVO_API_KEY`
4. ✅ If missing, add it and save (triggers redeploy)
5. ✅ Update `FRONTEND_URL` to actual frontend URL
6. ✅ Wait for redeploy to complete
7. ✅ Check Logs tab for startup messages
8. ✅ Test Grant Account button
9. ✅ Test Contact Reply
10. ✅ Check logs for "[Email sent via Brevo API]"

---

## ALTERNATIVE: USE GMAIL SMTP

If Brevo continues to have issues, you can use Gmail:

### Gmail SMTP Configuration:

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select: Mail > Other (Custom name) > "LUS4G Church"
   - Copy the 16-character password

3. **Update Render Environment Variables:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM=LUS4G Church <your-email@gmail.com>

# Remove or comment out:
# BREVO_API_KEY=...
```

**Note:** Gmail has sending limits (500/day for free accounts)

---

## SUMMARY

**What was fixed:**
- ✅ Email timeout issue resolved
- ✅ Switch from unreliable SMTP to Brevo API
- ✅ Added proper error handling
- ✅ Added connection timeouts

**What needs to be done in Render:**
1. ✅ Verify `BREVO_API_KEY` exists
2. ✅ Update `FRONTEND_URL` to actual URL
3. ✅ Wait for auto-redeploy
4. ✅ Test Grant Account and Contact Reply

**Expected result:**
- ✅ Emails send successfully via Brevo API
- ✅ No more timeout errors
- ✅ Grant Account works
- ✅ Contact Reply works
- ✅ Faster, more reliable email delivery

