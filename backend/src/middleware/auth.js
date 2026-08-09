const jwt  = require('jsonwebtoken');
const pool = require('../lib/db');

const ROLE_WEIGHTS = {
  superadmin: 100, admin: 80, pastor: 70, choir_director: 65, elder: 60,
  deacon: 50, leader: 40, choir_member: 30, member: 20, visitor: 10,
};

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Authentication required' });
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query(
      `SELECT u.*, m.id AS member_id, m.member_code, m.first_name, m.last_name,
              m.profile_photo_url, m.church_id AS member_church_id, m.approval_status,
              cm.is_director AS is_choir_director, cm.choir_role
       FROM users u 
       LEFT JOIN members m ON m.user_id = u.id
       LEFT JOIN choir_members cm ON cm.member_id = m.id AND cm.is_active = TRUE
       WHERE u.id = $1 AND u.is_active = TRUE`,
      [decoded.id]
    );
    if (!rows[0]) return res.status(401).json({ error: 'User not found or inactive' });
    req.user    = rows[0];
    req.member  = rows[0];
    req.churchId = rows[0].church_id || rows[0].member_church_id;
    req.isChoirDirector = rows[0].is_choir_director === true || rows[0].choir_role === 'choir_director';
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole) return res.status(401).json({ error: 'Not authenticated' });
    const userWeight = ROLE_WEIGHTS[userRole] ?? 0;
    const minWeight  = Math.min(...allowedRoles.map((r) => ROLE_WEIGHTS[r] ?? 999));
    if (userWeight >= minWeight) return next();
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

const requireAdmin  = requireRole('admin', 'superadmin');
const requireLeader = requireRole('leader', 'deacon', 'elder', 'pastor', 'admin', 'superadmin');
const requireChoir  = requireRole('choir_member', 'leader', 'deacon', 'elder', 'pastor', 'choir_director', 'admin', 'superadmin');
const requirePastor = requireRole('pastor', 'admin', 'superadmin');

// Choir Director or Admin can manage choir
function requireChoirDirector(req, res, next) {
  const isAdmin = ROLE_WEIGHTS[req.user?.role] >= ROLE_WEIGHTS['admin'];
  const isDirector = req.isChoirDirector === true || req.user?.role === 'choir_director';
  if (isAdmin || isDirector) return next();
  return res.status(403).json({ error: 'Choir director or admin access required' });
}

function requireSelfOrAdmin(req, res, next) {
  const isAdmin = ROLE_WEIGHTS[req.user?.role] >= ROLE_WEIGHTS['admin'];
  const isSelf  = req.user?.member_id === req.params.id || req.user?.id === req.params.id;
  if (isAdmin || isSelf) return next();
  return res.status(403).json({ error: 'Access denied' });
}

function requireSameChurch(req, res, next) {
  const churchId = req.churchId || req.user?.church_id || req.user?.member_church_id || process.env.DEFAULT_CHURCH_ID;
  if (!churchId) return res.status(403).json({ error: 'No church assigned' });
  req.churchId = churchId;
  next();
}

module.exports = {
  authenticate, requireRole, requireAdmin, requireLeader,
  requireChoir, requirePastor, requireChoirDirector,
  requireSelfOrAdmin, requireSameChurch, ROLE_WEIGHTS,
};
