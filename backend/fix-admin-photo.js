const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixAdminPhoto() {
  const client = await pool.connect();
  try {
    console.log('Checking admin profile...');
    
    // Get admin user
    const { rows: [admin] } = await client.query(`
      SELECT m.id, m.email, m.profile_photo_url, m.first_name, m.last_name
      FROM members m
      JOIN users u ON u.id = m.user_id
      WHERE u.email = 'edwardcole203@gmail.com'
      LIMIT 1
    `);
    
    if (!admin) {
      console.log('❌ Admin not found with email: edwardcole203@gmail.com');
      return;
    }
    
    console.log('Found admin:', admin.first_name, admin.last_name);
    console.log('Current photo URL:', admin.profile_photo_url);
    
    // Check if photo URL is broken (contains [object Object] or is invalid)
    if (!admin.profile_photo_url || 
        admin.profile_photo_url.includes('[object') || 
        admin.profile_photo_url.includes('undefined') ||
        !admin.profile_photo_url.startsWith('http')) {
      
      console.log('⚠️  Profile photo URL is broken, setting to placeholder...');
      
      // Use a proper placeholder image URL
      const placeholderUrl = 'https://res.cloudinary.com/fxyhv4g3/image/upload/v1/lus4g-church/profiles/default-avatar.png';
      
      await client.query(`
        UPDATE members 
        SET profile_photo_url = $1, updated_at = NOW()
        WHERE id = $2
      `, [placeholderUrl, admin.id]);
      
      console.log('✅ Admin photo updated to placeholder');
      console.log('📸 New URL:', placeholderUrl);
      console.log('');
      console.log('🔔 NEXT STEP: Admin should upload their real photo from the Profile page in the dashboard');
    } else {
      console.log('✅ Admin photo URL looks good!');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixAdminPhoto();
