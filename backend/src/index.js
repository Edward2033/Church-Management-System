require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const pool               = require('./lib/db');
const { registerBirthdayJob } = require('./jobs/birthday.job');
const { startVerseGenerationJob } = require('./jobs/verse-generation.job');

const authRouter       = require('./routes/auth');
const membersRouter    = require('./routes/members');
const choirRouter      = require('./routes/choir');
const financeRouter    = require('./routes/finance');
const cmsRouter        = require('./routes/cms');
const contentRouter    = require('./routes/content');
const reportsRouter    = require('./routes/reports');
const leadershipRouter = require('./routes/leadership');
const broadcastsRouter = require('./routes/broadcasts');
const permissionsRouter = require('./routes/permissions');
const subadminRouter   = require('./routes/subadmin');
const heroRouter       = require('./routes/hero');
const profileRouter    = require('./routes/profile');
const contactRouter    = require('./routes/contact');
const verifyRouter     = require('./routes/verify');
const versesRouter     = require('./routes/verses');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Allow configured frontend URL
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:4173',
      'https://church-management-system-blue.vercel.app', // Vercel frontend
    ].filter(Boolean);
    
    // Allow any Vercel.app subdomain
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Allow any Render.com subdomain
    if (origin.includes('.onrender.com')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('[CORS] Blocked origin:', origin);
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// No-cache for API responses
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Routes
app.use('/api/auth',        authRouter);
app.use('/api/members',     membersRouter);
app.use('/api/choir',       choirRouter);
app.use('/api/finance',     financeRouter);
app.use('/api/cms',         cmsRouter);
app.use('/api/reports',     reportsRouter);
app.use('/api/leadership',  leadershipRouter);
app.use('/api/broadcasts',  broadcastsRouter);
app.use('/api/permissions', permissionsRouter);
app.use('/api/subadmin',    subadminRouter);
app.use('/api/hero',        heroRouter);
app.use('/api/profile',     profileRouter);
app.use('/api/contact',     contactRouter);
app.use('/api/verify',      verifyRouter);
app.use('/api/verses',      versesRouter);
app.use('/api',             contentRouter);  // catch-all content routes last

// Health check
app.get('/health', (_, res) => res.json({
  status: 'ok',
  app: 'LUS4G Church Management Platform',
  version: '1.3.0',
  routes: ['auth','members','choir','finance','cms','reports','leadership','broadcasts','permissions','subadmin','hero','profile','contact','verify','verses'],
  timestamp: new Date().toISOString(),
}));

// Test email endpoint (admin only)
app.post('/api/test-email', async (req, res) => {
  try {
    const { sendEmail } = require('./lib/email');
    const { to, subject = 'Test Email from LUS4G Church' } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Recipient email (to) is required' });
    }
    
    await sendEmail({
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7c3aed;">Test Email from LUS4G Church</h2>
          <p>This is a test email to verify email delivery is working correctly.</p>
          <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
          <p>If you received this email, the email system is working properly! ✅</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated test email from LUS4G Church Management System.
          </p>
        </div>
      `
    });
    
    res.json({ 
      success: true, 
      message: `Test email sent successfully to ${to}`,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Test email error]', err);
    res.status(500).json({ 
      error: 'Failed to send test email', 
      details: err.message 
    });
  }
});

// 404
app.use((_, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

async function boot() {
  try {
    // Test database connection
    console.log('[SYSTEM] Testing database connection...');
    const result = await pool.query('SELECT NOW() as now');
    console.log('[SYSTEM] Database connection successful! Server time:', result.rows[0].now);
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[SYSTEM] ✓ LUS4G Church Platform running on port ${PORT}`);
      console.log(`[SYSTEM] ✓ Health check: http://localhost:${PORT}/health`);
      registerBirthdayJob();
      startVerseGenerationJob();
    });
  } catch (err) {
    console.error('[SYSTEM] ✗ Boot failed:', err.message);
    console.error('[SYSTEM] ✗ Stack trace:', err.stack);
    process.exit(1);
  }
}

boot();
