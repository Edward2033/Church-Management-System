require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const pool               = require('./lib/db');
const { registerBirthdayJob } = require('./jobs/birthday.job');

const authRouter       = require('./routes/auth');
const membersRouter    = require('./routes/members');
const choirRouter      = require('./routes/choir');
const financeRouter    = require('./routes/finance');
const cmsRouter        = require('./routes/cms');
const contentRouter    = require('./routes/content');
const reportsRouter    = require('./routes/reports');
const leadershipRouter = require('./routes/leadership');
const broadcastsRouter = require('./routes/broadcasts');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
app.use('/api',             contentRouter);  // catch-all content routes last

// Health check
app.get('/health', (_, res) => res.json({
  status: 'ok',
  app: 'LUS4G Church Management Platform',
  timestamp: new Date().toISOString(),
}));

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
    });
  } catch (err) {
    console.error('[SYSTEM] ✗ Boot failed:', err.message);
    console.error('[SYSTEM] ✗ Stack trace:', err.stack);
    process.exit(1);
  }
}

boot();
