# 🚀 Deployment Guide - Render + Vercel

Complete step-by-step guide to deploy the LUS4G Church Management Platform.

**Backend**: Render.com  
**Frontend**: Vercel  
**Database**: Supabase (already set up)

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- ✅ GitHub repository: https://github.com/Edward2033/Church-Management-System
- ✅ Supabase account with database created
- ✅ Database schema deployed (`database/schema.sql` run in Supabase SQL Editor)
- ✅ Render.com account (sign up at https://render.com)
- ✅ Vercel account (sign up at https://vercel.com)
- ✅ Brevo account for email (optional but recommended)
- ✅ Twilio account for SMS/WhatsApp (optional)

---

## Part 1: Deploy Backend to Render.com

### Step 1: Create Web Service

1. Go to https://render.com/dashboard
2. Click **"New +"** button → Select **"Web Service"**
3. Click **"Build and deploy from a Git repository"** → **Next**
4. Connect your GitHub account if not already connected
5. Find and select: `Edward2033/Church-Management-System`
6. Click **"Connect"**

### Step 2: Configure Web Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `lus4g-church-backend` (or your choice) |
| **Region** | Choose closest to your users (e.g., Oregon, Frankfurt) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (or Starter for better performance) |

### Step 3: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add each of these (click "+ Add Environment Variable" for each):

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=your_supabase_pooler_connection_string_here
JWT_SECRET=your_secure_jwt_secret_here_use_openssl_rand_base64_32
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_secure_refresh_secret_here_use_openssl_rand_base64_32
JWT_REFRESH_EXPIRES_IN=7d
DEFAULT_CHURCH_ID=00000000-0000-0000-0000-000000000001
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_email_here
SMTP_PASS=your_brevo_smtp_password_here
EMAIL_FROM=Your Church Name <no-reply@yourchurch.org>
BREVO_API_KEY=your_brevo_api_key_here
TWILIO_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE=your_twilio_phone_number
TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number
UPLOAD_DIR=../uploads
MAX_FILE_SIZE_MB=10
TZ=Africa/Accra
```

**Note**: Replace all placeholder values with your actual credentials from:
- Supabase: Database URL (use pooler URL with port 6543)
- Brevo: SMTP credentials and API key
- Twilio: Account SID, Auth Token, and phone numbers

**IMPORTANT**: 
- `FRONTEND_URL` will be added later (after deploying frontend to Vercel)
- `BASE_URL` will be your Render URL (we'll add this after deployment)

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will start building and deploying
3. Wait 2-5 minutes for deployment to complete
4. Once deployed, you'll see **"Live"** status with a green dot

### Step 5: Note Your Backend URL

Your backend will be deployed at:
```
https://lus4g-church-backend.onrender.com
```
(Replace `lus4g-church-backend` with whatever name you chose)

### Step 6: Test Backend

Open in browser:
```
https://your-backend-name.onrender.com/health
```

You should see:
```json
{
  "status": "ok",
  "app": "LUS4G Church Management Platform",
  "timestamp": "2026-08-02T..."
}
```

✅ **Backend deployment complete!**

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Import Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. If not connected, click **"Connect with GitHub"**
5. Find and select: `Edward2033/Church-Management-System`
6. Click **"Import"**

### Step 2: Configure Project

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` (click Edit and select `frontend` folder) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Node.js Version** | 18.x (or latest) |

### Step 3: Add Environment Variables

Click **"Environment Variables"** section

Add these variables:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://your-backend-name.onrender.com/api` |
| `VITE_CHURCH_NAME` | `LUS4G Church` |
| `VITE_DEFAULT_CHURCH_ID` | `00000000-0000-0000-0000-000000000001` |

**Replace** `your-backend-name` with your actual Render backend URL!

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy (takes 1-3 minutes)
3. Once complete, you'll see **"Congratulations!"** with your live URL

### Step 5: Note Your Frontend URL

Your frontend will be deployed at:
```
https://your-app-name.vercel.app
```

### Step 6: Test Frontend

Open in browser:
```
https://your-app-name.vercel.app
```

You should see the beautiful dark-themed homepage with hero slider!

✅ **Frontend deployment complete!**

---

## Part 3: Connect Frontend and Backend

### Step 1: Update Backend CORS

1. Go back to Render dashboard
2. Open your backend service
3. Go to **"Environment"** tab
4. Add/Update these environment variables:

| Name | Value |
|------|-------|
| `FRONTEND_URL` | `https://your-app-name.vercel.app` |
| `BASE_URL` | `https://your-backend-name.onrender.com` |

5. Click **"Save Changes"**
6. Render will automatically redeploy

### Step 2: Verify Connection

1. Open your frontend: `https://your-app-name.vercel.app`
2. Open browser DevTools (F12) → Console
3. Navigate to Announcements or Activities page
4. You should see data loading (not demo data)
5. Try logging in

✅ **Frontend and Backend connected!**

---

## Part 4: Final Configuration

### Database Verification

1. Open Supabase dashboard: https://supabase.com/dashboard
2. Go to your project
3. Click **"SQL Editor"**
4. Run this query:
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM members;
SELECT COUNT(*) FROM churches;
```

If you get results, database is connected! ✅

### Create Admin Account

Run this in Supabase SQL Editor:

```sql
-- Create admin user
INSERT INTO users (id, church_id, email, password_hash, role, is_active, password_set)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'admin@lus4g.org',
  crypt('Admin@123', gen_salt('bf')),
  'admin',
  true,
  true
);

-- Create member record for admin
INSERT INTO members (
  user_id, 
  church_id, 
  first_name, 
  last_name, 
  email, 
  phone, 
  member_code, 
  approval_status
)
VALUES (
  (SELECT id FROM users WHERE email = 'admin@lus4g.org'),
  '00000000-0000-0000-0000-000000000001',
  'Admin',
  'User',
  'admin@lus4g.org',
  '+233200000001',
  'ADM-0001',
  'approved'
);
```

### Test Login

1. Go to `https://your-app-name.vercel.app/login`
2. Email: `admin@lus4g.org`
3. Password: `Admin@123`
4. Click Login
5. You should be redirected to admin dashboard

✅ **Admin account working!**

---

## 🎯 Post-Deployment Checklist

Test each of these:

### Public Pages
- [ ] Homepage loads with hero slider
- [ ] About page displays correctly
- [ ] Announcements page shows cards (not demo data)
- [ ] Activities page shows grid layout
- [ ] Gallery page loads
- [ ] Contact form can be submitted

### Authentication
- [ ] Can register new member
- [ ] Can login with credentials
- [ ] Login redirects to correct dashboard
- [ ] Logout works

### Admin Dashboard
- [ ] Dashboard overview shows stats
- [ ] Can view members list
- [ ] Can add new member
- [ ] Can create announcement
- [ ] Can upload to gallery
- [ ] Can view reports

### Member Portal
- [ ] Can view profile
- [ ] Can edit profile
- [ ] Can view directory
- [ ] Can view notifications
- [ ] Can submit donation

### Technical
- [ ] API calls work (check Network tab in DevTools)
- [ ] No CORS errors in console
- [ ] Images load correctly
- [ ] Forms submit successfully
- [ ] Database queries work

---

## 🔧 Troubleshooting

### Issue: CORS Errors

**Symptoms**: Console shows "CORS policy" errors

**Solution**:
1. Check `FRONTEND_URL` in Render matches your Vercel URL exactly
2. Include `https://` in the URL
3. Don't include trailing slash
4. Save and redeploy backend

### Issue: API Not Found (404)

**Symptoms**: API calls return 404

**Solution**:
1. Check `VITE_API_URL` in Vercel environment variables
2. Should be: `https://your-backend.onrender.com/api` (with `/api`)
3. Redeploy frontend after changing

### Issue: Database Connection Error

**Symptoms**: Backend logs show "connection refused"

**Solution**:
1. Use Supabase **pooler** URL (port 6543, not 5432)
2. Check DATABASE_URL format:
   ```
   postgresql://postgres.[ref]:[password]@aws-X-X-X.pooler.supabase.com:6543/postgres
   ```
3. Encode special characters in password (use %40 for @, %21 for !)

### Issue: Render Free Instance Sleeps

**Problem**: Backend takes 30+ seconds to respond after inactivity

**Solution** (choose one):
1. Upgrade to Starter plan ($7/month) - no sleep
2. Use a uptime monitor (e.g., UptimeRobot) to ping every 10 minutes
3. Accept the sleep behavior for low-traffic sites

### Issue: Build Fails on Render

**Check**:
1. Build command is `npm install` (not `npm ci`)
2. Root directory is `backend`
3. Node version is 18+ (default should work)
4. Check Render logs for specific error

### Issue: Build Fails on Vercel

**Check**:
1. Root directory is `frontend`
2. Build command is `npm run build`
3. Output directory is `dist`
4. Framework preset is Vite
5. Check Vercel logs for specific error

---

## 📊 Monitoring

### Render Metrics
- View logs: Render Dashboard → Your Service → Logs
- Check CPU/Memory: Render Dashboard → Your Service → Metrics
- Set up alerts in Render dashboard

### Vercel Analytics
- View deployments: Vercel Dashboard → Your Project → Deployments
- Check build logs: Click any deployment → View Logs
- Enable Vercel Analytics for visitor stats (paid feature)

### Supabase Monitoring
- View logs: Supabase Dashboard → Your Project → Database → Logs
- Check connections: Database → Connection Pooling
- Monitor usage: Project Settings → Usage

---

## 🎨 Customization After Deployment

### Update Church Name
1. Vercel: Update `VITE_CHURCH_NAME` environment variable
2. Redeploy frontend

### Update Colors
1. Edit `frontend/tailwind.config.ts` in GitHub
2. Modify `brand` colors
3. Commit and push - Vercel auto-deploys

### Add Custom Domain

**For Vercel** (Frontend):
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `www.lus4gchurch.org`)
3. Follow DNS setup instructions

**For Render** (Backend):
1. Render Dashboard → Your Service → Settings → Custom Domains
2. Add your API subdomain (e.g., `api.lus4gchurch.org`)
3. Follow DNS setup instructions
4. Update `VITE_API_URL` in Vercel to new domain

---

## 💰 Cost Estimate

### Free Tier (Good for Testing)
- **Render Free**: Backend (sleeps after 15 min inactivity)
- **Vercel Hobby**: Frontend (unlimited bandwidth)
- **Supabase Free**: Database (500MB, 2GB bandwidth/month)
- **Total**: $0/month

### Recommended Production
- **Render Starter**: $7/month (no sleep, better performance)
- **Vercel Pro**: $20/month (better analytics, support)
- **Supabase Pro**: $25/month (8GB, better support)
- **Total**: ~$52/month

### Budget Production
- **Render Starter**: $7/month
- **Vercel Hobby**: $0/month (sufficient for small churches)
- **Supabase Free**: $0/month (monitor usage)
- **Total**: $7/month

---

## 🔐 Security Best Practices

### After Deployment

1. **Change Default Secrets**
   - Generate new JWT_SECRET (use: `openssl rand -base64 32`)
   - Generate new JWT_REFRESH_SECRET
   - Update in Render environment variables

2. **Review CORS Settings**
   - Ensure FRONTEND_URL is exact Vercel URL
   - Don't use wildcards in production

3. **Database Security**
   - Use strong Supabase password
   - Enable Row Level Security (RLS) if needed
   - Monitor unusual queries in logs

4. **Email/SMS Credentials**
   - Rotate Brevo API key regularly
   - Rotate Twilio auth token regularly
   - Monitor usage for unusual activity

---

## 🎉 Success!

If you've completed all steps, you now have:

✅ **Backend** running on Render  
✅ **Frontend** running on Vercel  
✅ **Database** on Supabase  
✅ **Admin account** created  
✅ **Everything connected** and working  

**Your church management platform is LIVE!** 🚀

---

## 📞 Need Help?

- **Email**: edwardcole203@gmail.com
- **GitHub Issues**: https://github.com/Edward2033/Church-Management-System/issues
- **Render Support**: https://render.com/support
- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support

---

**Deployment Date**: ___________  
**Backend URL**: ___________  
**Frontend URL**: ___________  
**Admin Email**: ___________  

*Keep this information safe!*
