# LUS4G Church Platform - Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Prerequisites
- Node.js 16+ installed
- Supabase account with database created
- Git Bash or Windows Terminal

---

## Step 1: Deploy Database (2 minutes)

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to **SQL Editor** → **New Query**
3. Open `database/schema.sql` in this folder
4. Copy ALL content and paste into Supabase SQL Editor
5. Click **Run** (Ctrl+Enter)
6. ✅ Done! 28 tables created

---

## Step 2: Start Backend (30 seconds)

```bash
cd backend
npm run dev
```

**Check**: Open http://localhost:5000/health  
Should see: `{"status": "ok"}`

---

## Step 3: Start Frontend (30 seconds)

Open **NEW** terminal:

```bash
cd frontend
npm run dev
```

**Check**: Open http://localhost:5173  
Should see: Beautiful dark homepage with hero slider

---

## Step 4: Login & Test

### Create Admin Account (in Supabase SQL Editor):
```sql
-- Run this to create admin user
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
```

### Login:
1. Go to http://localhost:5173/login
2. Email: `admin@lus4g.org`
3. Password: `Admin@123`
4. ✅ Click Login → Admin Dashboard

---

## ✅ What to Test

### Public Pages (No Login):
- ✅ Homepage - Hero slider, features, stats
- ✅ About - Mission, vision, leadership
- ✅ Announcements - Card layout with filters
- ✅ Activities - Grid cards with event details
- ✅ Gallery - Photo grid with lightbox
- ✅ Contact - Form with contact info

### Admin Dashboard (After Login):
- ✅ Overview - Stats and birthday notifications
- ✅ Members - Add/edit members
- ✅ Choir - Manage choir members
- ✅ Announcements - Create announcements
- ✅ Activities - Schedule events
- ✅ Gallery - Upload photos
- ✅ Donations - Track giving
- ✅ Notifications - Send notifications

---

## 🎨 Design Features

All pages use:
- **Dark Theme**: slate-950 background
- **Purple**: Primary color (brand-600)
- **Gold**: Accent color
- **Glass Cards**: Blur effects
- **Smooth Animations**: Hover & scroll effects

---

## 🐛 Quick Fixes

**Backend won't start?**
```bash
cd backend
npm install
npm run dev
```

**Frontend won't start?**
```bash
cd frontend
npm install
npm run dev
```

**Can't login?**
- Check backend is running (http://localhost:5000/health)
- Check user exists in database
- Verify DATABASE_URL in `backend/.env`

**Pages show demo data?**
- Backend not running → Start backend
- Database empty → Run schema.sql again

---

## 📂 Folder Structure

```
lus4g-church-platform/
├── backend/              Backend API
│   ├── src/
│   │   ├── routes/       All API routes ✅
│   │   ├── lib/          Database & utilities
│   │   └── index.js      Main server file
│   └── .env              Environment variables ✅
├── frontend/             React frontend
│   ├── src/
│   │   ├── pages/        All pages ✅
│   │   ├── components/   Reusable components
│   │   └── lib/          API client
│   └── .env              Frontend config ✅
├── database/             SQL scripts
│   ├── schema.sql        Main schema ✅
│   ├── sample-data.sql   Test data
│   └── verify-tables.sql Check tables
└── SETUP_INSTRUCTIONS.md Full guide ✅
```

---

## 📞 Need Help?

1. Check `CURRENT_STATUS.md` - Full status report
2. Check `SETUP_INSTRUCTIONS.md` - Detailed guide
3. Check backend console for errors
4. Check browser console for frontend errors

---

## 🎯 Next Steps After Setup

1. Add real church data (name, logo, contact)
2. Create member accounts
3. Upload photos to gallery
4. Create announcements
5. Schedule events/activities
6. Customize colors in `tailwind.config.js`

---

**That's it!** You're ready to go! 🎉

The platform is fully functional with:
✅ All routes created  
✅ Consistent dark theme  
✅ Admin & member dashboards  
✅ Complete database schema  
✅ Ready for production  
