# LUS4G Church Management System

A comprehensive church management platform with member management, choir system, attendance tracking, donations, and more.

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🌟 Features

### Member Management
- ✅ Member registration with approval workflow
- ✅ Profile management with photo upload
- ✅ Member directory with search and filters
- ✅ Birthday notifications and reminders
- ✅ Print ID cards and member profiles
- ✅ Age validation (minimum 12 years)

### Choir System
- ✅ Voice group assignments (Soprano, Alto, Tenor, Bass)
- ✅ Rehearsal scheduling
- ✅ Music library with lyrics and notes
- ✅ Choir broadcasts (Email + SMS + WhatsApp)
- ✅ Choir director management portal

### Attendance Tracking
- ✅ Create attendance sessions
- ✅ Email invitations with RSVP buttons
- ✅ Real-time attendance reports
- ✅ Export attendance to Excel

### Financial Management
- ✅ Donations tracking (tithe, offering, special)
- ✅ Income and expense management
- ✅ Financial reports and summaries

### Communication
- ✅ Announcements with categories
- ✅ In-app notifications
- ✅ Email notifications
- ✅ SMS and WhatsApp broadcasts (via Twilio)

### Content Management
- ✅ Homepage customization
- ✅ Hero slider management
- ✅ Gallery with photo upload
- ✅ Leadership profiles
- ✅ Activities and events
- ✅ Daily Bible verses

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)
- SMTP service (Gmail, Brevo, SendGrid, etc.)
- Optional: Twilio account for SMS/WhatsApp

### 1. Clone Repository
```bash
git clone https://github.com/Edward2033/Church-Management-System.git
cd Church-Management-System
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your_strong_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
EMAIL_FROM=Church Name <no-reply@church.org>

# Optional: Twilio (SMS/WhatsApp)
TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# URLs
FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:5000

# Church
DEFAULT_CHURCH_ID=00000000-0000-0000-0000-000000000001

# Optional: Cloudinary (Image hosting)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Initialize database:
```bash
npm run db:init
```

Start backend:
```bash
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_CHURCH_NAME=LUS4G Church
VITE_DEFAULT_CHURCH_ID=00000000-0000-0000-0000-000000000001
```

Start frontend:
```bash
npm run dev
```

Visit: **http://localhost:5173**

---

## 📁 Project Structure

```
lus4g-church-platform/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── jobs/        # Cron jobs (birthdays)
│   │   ├── lib/         # Database, email, utilities
│   │   ├── middleware/  # Auth middleware
│   │   └── routes/      # API endpoints
│   ├── .env
│   └── package.json
├── frontend/            # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── lib/         # API client, utilities
│   │   └── pages/       # Page components
│   ├── .env
│   └── package.json
├── database/
│   └── schema.sql       # Database schema
└── README.md
```

---

## 🔑 Default Admin Account

After running `npm run db:init`, create an admin account:

1. Register at `/register`
2. Check database for pending user
3. Manually approve in database:
```sql
UPDATE members SET approval_status = 'approved' WHERE email = 'your@email.com';
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 🌐 Deployment

### Backend (Render.com)
1. Create new Web Service
2. Connect GitHub repository
3. Set root directory: `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables from `.env`

### Frontend (Vercel)
1. Import project from GitHub
2. Set root directory: `frontend`
3. Framework: Vite
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variables from `.env`

### Database (Supabase)
1. Create new project
2. Run `database/schema.sql` in SQL Editor
3. Use connection pooler URL (port 6543) in DATABASE_URL

---

## 📖 API Documentation

### Authentication
- `POST /api/auth/register` - Register member
- `POST /api/auth/login` - Login
- `POST /api/auth/approve/:id` - Approve member (admin)

### Members
- `GET /api/members` - List members
- `GET /api/members/:id` - Get member
- `PATCH /api/members/:id` - Update member
- `GET /api/members/birthdays` - Get birthdays this month

### Choir
- `GET /api/choir` - List choir members
- `GET /api/choir/rehearsals` - List rehearsals
- `POST /api/choir/rehearsals` - Create rehearsal
- `GET /api/choir/music` - Music library
- `POST /api/broadcasts` - Send broadcast

### Attendance
- `GET /api/attendance` - List sessions
- `POST /api/attendance` - Create session
- `GET /api/attendance/:id/responses` - Get responses
- `GET /api/attendance/:sessionId/respond` - RSVP to session

### Finance
- `GET /api/donations` - List donations
- `POST /api/donations` - Record donation
- `GET /api/finance/summary` - Financial summary

---

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- PostgreSQL (Supabase)
- JWT Authentication
- Nodemailer (Email)
- Twilio (SMS/WhatsApp)
- Cloudinary (Image hosting)
- Node-cron (Scheduled jobs)

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Framer Motion
- Recharts (Analytics)
- Sonner (Notifications)

---

## 🔒 Security

- JWT tokens with refresh mechanism
- Password hashing with bcrypt
- Role-based access control
- Input validation
- SQL injection protection (parameterized queries)
- CORS configuration
- Helmet security headers

---

## 📧 Support

- **Email**: edwardcole203@gmail.com
- **GitHub**: [Issues](https://github.com/Edward2033/Church-Management-System/issues)

---

## 📜 License

MIT License - feel free to use for your church!

---

**Made with ❤️ for the Kingdom of God**
