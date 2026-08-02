# LUS4G Church Management Platform

A unified church management system combining the LUS4G Church Website and LUS4G Choir System into one complete platform.

---

## Project Structure

```
lus4g-church-platform/
├── backend/                  # Node.js / Express API
│   ├── src/
│   │   ├── config/           # (reserved for future config modules)
│   │   ├── jobs/             # Cron jobs (birthday notifications)
│   │   ├── lib/              # db.js, email.js, initDb.js
│   │   ├── middleware/       # auth.js (JWT + role guards)
│   │   ├── routes/           # All API route handlers
│   │   │   ├── auth.js       # Register, login, approve, setup-password
│   │   │   ├── members.js    # Member CRUD + stats + birthdays
│   │   │   ├── choir.js      # Choir members, rehearsals, music library
│   │   │   ├── broadcasts.js # Choir broadcasts (email/SMS/WhatsApp)
│   │   │   ├── finance.js    # Transactions, categories, summary, report
│   │   │   ├── content.js    # Announcements, events, gallery, sermons, donations
│   │   │   ├── cms.js        # Hero slides, pages, settings
│   │   │   ├── leadership.js # Leadership profiles
│   │   │   └── reports.js    # Overview, members, attendance, finance, choir
│   │   ├── services/
│   │   │   └── notification.js  # Email + SMS + WhatsApp (Twilio)
│   │   └── index.js          # Express app entry point
│   ├── .env                  # Environment variables (copy and fill in)
│   └── package.json
├── frontend/                 # React + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── components/       # Navbar, Footer, HeroSlider, etc.
│   │   ├── contexts/         # AuthContext
│   │   ├── lib/              # api.ts (typed API client), print.ts
│   │   └── pages/
│   │       ├── admin/
│   │       │   ├── AdminOverview.tsx      # Dashboard stats + pending approvals
│   │       │   ├── AdminMembers.tsx       # Full member management
│   │       │   ├── AdminChoir.tsx         # Choir members, rehearsals, music, broadcasts
│   │       │   ├── AdminAnnouncements.tsx
│   │       │   ├── AdminActivities.tsx
│   │       │   ├── AdminGallery.tsx
│   │       │   ├── AdminDonations.tsx
│   │       │   └── AdminNotifications.tsx
│   │       ├── AdminDashboard.tsx         # Admin shell with sidebar
│   │       ├── MemberDashboard.tsx        # Member portal (+ Choir Portal for choir members)
│   │       ├── HomePage.tsx
│   │       ├── RegisterPage.tsx           # Multi-step: member or choir member
│   │       ├── LoginPage.tsx
│   │       └── ...public pages
│   ├── .env
│   └── package.json
├── database/
│   └── schema.sql            # Full unified PostgreSQL schema
├── uploads/                  # File upload directories
└── package.json              # Root scripts
```

---

## Setup

### 1. Configure Environment

Edit `backend/.env` and fill in your values:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=your_strong_secret_here
SMTP_USER=your@email.com
SMTP_PASS=your_smtp_password
TWILIO_SID=your_twilio_sid          # optional — for SMS/WhatsApp
TWILIO_AUTH_TOKEN=your_token        # optional
FRONTEND_URL=http://localhost:5173
```

> The `DATABASE_URL` uses the **LUS4G Supabase connection** as the single database for the entire platform.

### 2. Initialize Database

```bash
cd backend
npm install
npm run db:init
```

This runs `database/schema.sql` against your Supabase PostgreSQL instance, creating all tables and the default church record.

### 3. Start Backend

```bash
cd backend
npm run dev        # development (nodemon)
# or
npm start          # production
```

Backend runs on **http://localhost:5000**

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## Features

### Public Website
- Home page with hero slider, announcements, activities
- About, Gallery, Announcements, Activities, Contact pages
- Member & Choir registration (multi-step form)
- Login / Setup Password / Forgot Password

### Admin Dashboard (`/admin`)
| Section | Features |
|---|---|
| Overview | Stats: members, choir, pending, birthdays; approval queue; chart |
| Members | Full CRUD, approve/reject, print profile, export CSV |
| Choir | Members by voice group, rehearsal scheduling, music library, broadcasts |
| Announcements | Create/edit/delete, pin, category, expiry |
| Activities | Church events management |
| Gallery | Photo upload and management |
| Donations | Income tracking and summary |
| Notifications | Broadcast in-app notifications |

### Member Dashboard (`/dashboard`)
| Section | Features |
|---|---|
| Profile | View & edit profile, print/PDF |
| Directory | Browse all approved members, filter choir |
| Notifications | In-app notification feed |
| Give | Submit donations (tithe, offering, special) |
| Choir Portal | *(choir members only)* Rehearsal schedule + music library |

### Choir System (from LUS4G)
- Voice group assignments (Soprano, Alto, Tenor, Bass)
- Rehearsal scheduling
- Music library with lyrics and key notes
- Broadcasts: send messages to choir via **Email + SMS + WhatsApp** (Twilio)
- Choir member approval workflow

### Finance
- Income & expense tracking
- Categories, payment methods, receipt numbers
- Monthly trend reports
- Donation submission from member portal

---

## API Endpoints

| Prefix | Description |
|---|---|
| `POST /api/auth/register` | Register member or choir member |
| `POST /api/auth/login` | Login |
| `POST /api/auth/approve/:id` | Admin approve member |
| `GET /api/members` | List members |
| `GET /api/choir` | List choir members |
| `GET /api/choir/rehearsals` | List rehearsals |
| `GET /api/choir/music` | Music library |
| `POST /api/broadcasts` | Send choir broadcast |
| `GET /api/finance/summary` | Finance summary |
| `GET /api/reports/overview` | Dashboard stats |
| `GET /api/announcements` | Public announcements |
| `GET /api/gallery` | Gallery items |
| `GET /api/leadership` | Leadership profiles |
| `/health` | Health check |

---

## Database

Single PostgreSQL database (Supabase) with these key tables:

- `churches` — church record (seeded with default LUS4G church)
- `users` — authentication accounts
- `members` — member profiles
- `choir_members` — choir-specific data (voice, instruments, activities)
- `choir_broadcasts` — broadcast message history
- `events` / `event_registrations` — events and RSVP
- `attendance` — attendance records
- `finance_transactions` / `finance_categories` — finance
- `announcements`, `gallery`, `sermons`, `testimonials`
- `notifications`, `contact_messages`, `documents`
- `rehearsals`, `music_library`, `choir_dues`
- `cms_pages`, `cms_hero_slides`, `cms_settings`
- `leadership`, `departments`, `auth_tokens`, `audit_logs`

---

## Roles

`superadmin` → `admin` → `pastor` → `elder` → `deacon` → `leader` → `choir_member` → `member` → `visitor`

Admin dashboard accessible to: `admin`, `superadmin`, `pastor`, `elder`


---

## 🎨 UI Design

### Consistent Dark Theme
All pages now feature a unified dark theme for a modern, professional appearance:

- **Background**: Dark slate-950
- **Primary Color**: Brand purple-600
- **Accent**: Gold highlights
- **Cards**: Glass morphism with borders
- **Typography**: Crisp white text on dark backgrounds
- **Animations**: Smooth Framer Motion transitions

### Page Layouts
- **Homepage**: Hero slider, features, upcoming events, testimonials
- **About**: Church story, mission/vision, core values, leadership team
- **Announcements**: Card-based layout with category filters and pinned posts
- **Activities**: Grid of event cards with dates, times, and locations
- **Gallery**: Masonry grid with lightbox and category filters
- **Contact**: Split layout with contact info and submission form
- **Dashboards**: Modern admin and member portals with sidebar navigation

---

## ✅ Database Verification

After running `schema.sql`, verify your setup:

### Quick Check
```sql
-- Run this in Supabase SQL Editor
SELECT COUNT(*) AS table_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Should return 28+ tables
```

### Detailed Verification
Run the complete verification script:
```bash
# In Supabase SQL Editor, run:
database/verify-tables.sql
```

This checks:
- ✅ All 28 tables exist
- ✅ Default church record created
- ✅ Functions (generate_member_code, generate_receipt_number) exist
- ✅ Indexes created for performance
- ✅ Foreign key relationships established

### Add Sample Data
To test with sample accounts and data:
```bash
# In Supabase SQL Editor, run:
database/sample-data.sql
```

**Test Accounts Created:**
| Email | Password | Role |
|---|---|---|
| admin@lus4g.org | Admin@123 | Admin |
| john.mensah@lus4g.org | Member@123 | Member |
| grace.asante@lus4g.org | Member@123 | Choir Member |
| samuel.boateng@lus4g.org | Member@123 | Member (Youth) |

---

## 🚀 Deployment

### Backend (Render.com)
1. Create Web Service
2. Connect GitHub repo
3. Build command: `cd backend && npm install`
4. Start command: `cd backend && npm start`
5. Add environment variables from `backend/.env`

### Frontend (Vercel/Render)
1. Create Static Site
2. Build command: `cd frontend && npm run build`
3. Publish directory: `frontend/dist`
4. Add environment variables from `frontend/.env`

### Database (Supabase)
- Already hosted on Supabase
- Use connection pooler URL (port 6543) for production
- Ensure schema is deployed via SQL Editor

---

## 📋 Troubleshooting

### Issue: API Proxy Errors (ECONNREFUSED)
**Cause**: Backend server not running  
**Solution**: Start backend with `npm run dev` in backend folder

### Issue: Pages Show Demo Data
**Cause**: Backend not connected or API endpoints failing  
**Solution**: Check backend console for errors, verify DATABASE_URL

### Issue: Database Connection Failed
**Solution**: 
- Verify `DATABASE_URL` in `.env` is correct
- Use Supabase pooler URL (port 6543, not 5432)
- Check Supabase project is active

### Issue: Login Not Working
**Solution**:
- Verify JWT_SECRET is set in backend `.env`
- Check user exists in database
- Verify password was set (password_set = true)

### Issue: Blank Pages After Navigation
**Solution**:
- This was fixed - all pages now use consistent dark theme
- If still occurring, check browser console for React errors
- Ensure frontend dev server is running

---

## 📚 Additional Documentation

- **Setup Guide**: See `SETUP_INSTRUCTIONS.md` for detailed setup
- **Database Schema**: See `database/schema.sql` for complete schema
- **Table Verification**: See `database/verify-tables.sql` for verification
- **Sample Data**: See `database/sample-data.sql` for test data

---

## 🆕 What's New in v3.0

### ✨ Features
- ✅ Unified church + choir platform
- ✅ Consistent dark theme across all pages
- ✅ Card-based layouts for better content organization
- ✅ Complete database schema with all relationships
- ✅ Admin and member dashboards fully integrated
- ✅ CMS for dynamic content management
- ✅ Reports and analytics system
- ✅ Email + SMS/WhatsApp notifications
- ✅ Choir-specific features (voice groups, rehearsals, broadcasts)
- ✅ Multi-tenant architecture support

### 🔧 Technical Improvements
- React 18 with TypeScript
- Vite for lightning-fast builds
- TanStack Query for server state
- Framer Motion animations
- Glass morphism UI design
- Responsive mobile-first layout
- JWT authentication with refresh tokens
- Row-level data isolation by church_id

---

## 📞 Support & Contributing

### Get Help
- 📧 Email: support@lus4g.org
- 📖 Docs: Read `SETUP_INSTRUCTIONS.md`
- 🐛 Issues: Report on GitHub Issues

### Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

**Version**: 3.0.0  
**Last Updated**: August 2, 2026  
**License**: MIT  
**Made with ❤️ for the Kingdom of God**
