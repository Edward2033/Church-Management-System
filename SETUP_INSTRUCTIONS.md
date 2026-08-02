# LUS4G Church Management Platform - Complete Setup Guide

## ✅ Current Status

### Completed:
- ✅ All backend routes created and configured
- ✅ All frontend pages using consistent dark theme
- ✅ Database schema is complete with all tables
- ✅ .env file has all required keys
- ✅ Frontend proxy configured correctly
- ✅ Admin and Member dashboards set up

---

## 📋 Database Setup in Supabase

### Step 1: Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Create a new project or use existing one
3. Wait for database to provision

### Step 2: Run the Complete Schema

Copy the entire content from `database/schema.sql` and run it in Supabase SQL Editor:

1. Open Supabase Dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Paste the **entire** `database/schema.sql` file
5. Click **Run** or press `Ctrl+Enter`

The schema will create:
- ✅ 30+ tables with all relationships
- ✅ Indexes for performance
- ✅ Triggers for auto-updating timestamps
- ✅ Functions for generating codes
- ✅ Default church record

### Step 3: Verify Tables Were Created

Run this query in Supabase SQL Editor to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**You should see these tables:**
- churches
- users
- members
- departments
- choir_members
- choir_broadcasts
- choir_dues
- auth_tokens
- events
- event_registrations
- attendance
- finance_categories
- finance_transactions
- notifications
- announcements
- gallery
- sermons
- testimonials
- prayer_requests
- contact_messages
- leadership
- documents
- cms_pages
- cms_hero_slides
- cms_settings
- rehearsals
- music_library
- audit_logs

---

## 🔑 Environment Variables

Your `.env` file already has all required keys. Verify these are correct:

### Backend `.env` (already configured):
```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com
DATABASE_URL=postgresql://postgres.xxx:password@aws-xxx.pooler.supabase.com:6543/postgres
JWT_SECRET=lus4g_secure_2026
DEFAULT_CHURCH_ID=00000000-0000-0000-0000-000000000001
# ... (rest is already set)
```

### Frontend `.env` (already configured):
```env
VITE_API_URL=/api
VITE_CHURCH_NAME=LUS4G Church
VITE_DEFAULT_CHURCH_ID=00000000-0000-0000-0000-000000000001
```

---

## 🚀 Running the Application

### Development Mode:

#### Terminal 1 - Backend:
```bash
cd lus4g-church-platform/backend
npm install
npm run dev
```

The backend should start on `http://localhost:5000`

#### Terminal 2 - Frontend:
```bash
cd lus4g-church-platform/frontend
npm install
npm run dev
```

The frontend should start on `http://localhost:5173`

### Verify Backend is Running:
Open `http://localhost:5000/health` in browser. You should see:
```json
{
  "status": "ok",
  "app": "LUS4G Church Management Platform",
  "timestamp": "2025-..."
}
```

---

## 👤 Create First Admin User

### Option 1: Using API (Recommended)

```bash
# Register first user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Admin",
    "last_name": "User",
    "email": "admin@lus4g.org",
    "phone": "+233200000001",
    "password": "Admin@123",
    "role": "admin"
  }'
```

### Option 2: Directly in Supabase

Run this in Supabase SQL Editor:

```sql
-- Insert admin user
INSERT INTO users (id, church_id, email, password_hash, role, is_active, password_set)
VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'admin@lus4g.org',
  crypt('Admin@123', gen_salt('bf')),
  'admin',
  true,
  true
);

-- Get the user_id from above insert, then create member record
INSERT INTO members (user_id, church_id, first_name, last_name, email, phone, member_code, approval_status)
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

---

## ✅ Verification Checklist

### Backend Verification:
- [ ] Backend starts without errors
- [ ] `/health` endpoint returns status "ok"
- [ ] All routes are registered (check console output)
- [ ] Database connection works (no DB errors in console)

### Frontend Verification:
- [ ] Frontend starts at `http://localhost:5173`
- [ ] Home page loads with dark theme
- [ ] All pages use consistent dark theme:
  - [ ] About
  - [ ] Announcements (card layout)
  - [ ] Activities (grid card layout)
  - [ ] Gallery
  - [ ] Contact
- [ ] Login page works
- [ ] Register page works

### Database Verification:
- [ ] All 28 tables exist in Supabase
- [ ] Default church record exists
- [ ] Can query tables without errors
- [ ] Foreign key relationships work

### Authentication Verification:
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] JWT token is generated
- [ ] Protected routes work
- [ ] Logout works

### Dashboard Verification:
- [ ] Admin can access `/admin` dashboard
- [ ] Member can access `/dashboard`
- [ ] All admin pages load:
  - [ ] Overview with stats
  - [ ] Members management
  - [ ] Choir management
  - [ ] Announcements CRUD
  - [ ] Activities/Events CRUD
  - [ ] Gallery management
  - [ ] Donations/Finance
  - [ ] Notifications
- [ ] All member dashboard pages load
- [ ] Data fetching works (no proxy errors)

---

## 🎨 UI Features

### Consistent Dark Theme:
- Background: `slate-950`
- Primary color: `brand-600` (purple)
- Accent color: `gold`
- Glass morphism cards
- Smooth animations
- Responsive design

### Page Layouts:
- **Homepage**: Hero slider + features + testimonials
- **About**: Story + mission/vision + leadership
- **Announcements**: Card layout with filters
- **Activities**: Grid cards with event details
- **Gallery**: Masonry grid with lightbox
- **Contact**: Split layout with form + info

---

## 🔧 Troubleshooting

### Issue: API Proxy Errors (ECONNREFUSED)
**Solution**: Backend is not running. Start backend with `npm run dev` in backend folder.

### Issue: Database Connection Error
**Solution**: 
1. Verify `DATABASE_URL` in `.env` is correct
2. Check Supabase project is active
3. Ensure database pooler URL is used (port 6543)

### Issue: Pages show demo data
**Solution**: Backend not connected. Check backend console for errors.

### Issue: TypeScript errors in frontend
**Solution**: These are warnings and won't prevent the app from running. The dev server ignores them.

### Issue: Admin can't access dashboard
**Solution**: Check user role is 'admin' in database:
```sql
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

## 📊 Database Relationships

```
churches (1) ─────┬─── (many) users
                  ├─── (many) members
                  ├─── (many) departments
                  ├─── (many) events
                  ├─── (many) finance_transactions
                  └─── (many) all other tables

members (1) ──────┬─── (1) choir_members
                  ├─── (many) attendance
                  ├─── (many) event_registrations
                  └─── (many) finance_transactions

events (1) ───────└─── (many) event_registrations
```

---

## 🎯 Next Steps After Setup

1. **Add Sample Data**: Create a few test members, events, and announcements
2. **Test Email**: Send a test email notification
3. **Test SMS**: Send a test WhatsApp message (if configured)
4. **Customize**: Update church name, logo, colors in CMS settings
5. **Upload Content**: Add real photos to gallery
6. **Configure Choir**: Add choir members and voice groups
7. **Financial Records**: Set up finance categories

---

## 📞 Support

If you encounter issues:
1. Check backend console for errors
2. Check browser console for frontend errors
3. Verify database connection in Supabase
4. Ensure all tables were created correctly

---

**Platform Version**: 3.0.0  
**Last Updated**: 2026-08-02  
**Tech Stack**: React + TypeScript + Node.js + Express + PostgreSQL (Supabase)
