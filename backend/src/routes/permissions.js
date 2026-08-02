const router = require('express').Router();
const pool = require('../lib/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/permissions - Get all permissions
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, code, name, description, category
      FROM permissions
      ORDER BY category, name
    `);
    
    // Group by category
    const grouped = rows.reduce((acc, perm) => {
      if (!acc[perm.category]) acc[perm.category] = [];
      acc[perm.category].push(perm);
      return acc;
    }, {});
    
    res.json({ permissions: rows, grouped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/permissions/user/:userId - Get user's permissions
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    
    // Only admins or the user themselves can view permissions
    if (!isAdmin && req.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const { rows } = await pool.query(`
      SELECT p.id, p.code, p.name, p.description, p.category,
             up.granted_at, up.granted_by,
             u.email as granted_by_email
      FROM user_permissions up
      JOIN permissions p ON p.id = up.permission_id
      LEFT JOIN users u ON u.id = up.granted_by
      WHERE up.user_id = $1
      ORDER BY p.category, p.name
    `, [userId]);
    
    res.json({ permissions: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/permissions/grant - Grant permissions to a user
router.post('/grant', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId, permissionIds } = req.body;
    
    if (!userId || !Array.isArray(permissionIds)) {
      return res.status(400).json({ error: 'userId and permissionIds array required' });
    }
    
    // Verify user exists and is in same church
    const userCheck = await pool.query(
      'SELECT id, church_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (userCheck.rows[0].church_id !== req.churchId) {
      return res.status(403).json({ error: 'Cannot grant permissions across churches' });
    }
    
    // Remove existing permissions
    await pool.query('DELETE FROM user_permissions WHERE user_id = $1', [userId]);
    
    // Grant new permissions
    if (permissionIds.length > 0) {
      const values = permissionIds.map((permId, idx) => 
        `($1, $${idx + 2}, $${permissionIds.length + 2})`
      ).join(', ');
      
      await pool.query(
        `INSERT INTO user_permissions (user_id, permission_id, granted_by)
         VALUES ${values}
         ON CONFLICT (user_id, permission_id) DO NOTHING`,
        [userId, ...permissionIds, req.user.id]
      );
    }
    
    res.json({ success: true, message: 'Permissions updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/permissions/revoke - Revoke specific permission
router.delete('/revoke', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId, permissionId } = req.body;
    
    await pool.query(
      'DELETE FROM user_permissions WHERE user_id = $1 AND permission_id = $2',
      [userId, permissionId]
    );
    
    res.json({ success: true, message: 'Permission revoked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware to check if user has specific permission
const hasPermission = (permissionCode) => {
  return async (req, res, next) => {
    try {
      // Admins have all permissions
      if (['admin', 'superadmin'].includes(req.user.role)) {
        return next();
      }
      
      const { rows } = await pool.query(`
        SELECT 1 FROM user_permissions up
        JOIN permissions p ON p.id = up.permission_id
        WHERE up.user_id = $1 AND p.code = $2
      `, [req.user.id, permissionCode]);
      
      if (rows.length === 0) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};

module.exports = router;
module.exports.hasPermission = hasPermission;
