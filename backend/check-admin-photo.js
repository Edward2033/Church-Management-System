const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAdminPhoto() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT m.id, m.email, m.first_name, m.last_name, m.profile_photo_url,
             u.role, m.member_code, m.approval_status
      FROM members m
      JOIN users u ON u.id = m.user_id
      WHERE u.email = 'edwardcole203@gmail.com'
      OR u.role = 'admin'
      ORDER BY m.created_at
    `);
    
    console.log('Found', rows.length, 'admin user(s):\n');
    
    rows.forEach((admin, i) => {
      console.log(`Admin #${i + 1}:`);
      console.log('  Name:', admin.first_name, admin.last_name);
      console.log('  Email:', admin.email);
      console.log('  Code:', admin.member_code);
      console.log('  Role:', admin.role);
      console.log('  Status:', admin.approval_status);
      console.log('  Photo URL:', admin.profile_photo_url);
      console.log('  Photo length:', admin.profile_photo_url?.length || 0);
      console.log('');
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAdminPhoto();
