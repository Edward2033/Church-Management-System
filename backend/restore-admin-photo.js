const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function restoreAdminPhoto() {
  const client = await pool.connect();
  try {
    // The correct photo URL from the earlier upload
    const correctPhotoUrl = 'https://res.cloudinary.com/fxyhv4g3/image/upload/v1785756266/lus4g-church/profiles/ywotd3wqxzrt0jcmwi4a.jpg';
    
    await client.query(`
      UPDATE members 
      SET profile_photo_url = $1, updated_at = NOW()
      WHERE email = 'edwardcole203@gmail.com'
    `, [correctPhotoUrl]);
    
    console.log('✅ Admin photo restored to:');
    console.log('   ', correctPhotoUrl);
    console.log('');
    console.log('🔄 Please refresh your browser to see the updated photo!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

restoreAdminPhoto();
