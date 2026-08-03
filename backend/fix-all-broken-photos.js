const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixAllBrokenPhotos() {
  const client = await pool.connect();
  try {
    console.log('🔍 Finding all members with broken photo URLs...\n');
    
    // Get all members with broken photo URLs
    const { rows: members } = await client.query(`
      SELECT id, email, profile_photo_url, first_name, last_name
      FROM members
      WHERE profile_photo_url IS NOT NULL
        AND (
          profile_photo_url LIKE '%"secure_url"%'
          OR profile_photo_url LIKE '%[object%'
          OR profile_photo_url LIKE '%undefined%'
        )
    `);
    
    console.log(`Found ${members.length} members with broken photo URLs\n`);
    
    if (members.length === 0) {
      console.log('✅ No broken photos found! All images are OK.');
      return;
    }
    
    let fixed = 0;
    let failed = 0;
    
    for (const member of members) {
      try {
        console.log(`Fixing: ${member.first_name} ${member.last_name} (${member.email})`);
        
        let newUrl = null;
        
        // Try to parse as JSON and extract secure_url
        try {
          const photoObj = JSON.parse(member.profile_photo_url);
          if (photoObj.secure_url) {
            newUrl = photoObj.secure_url;
            console.log(`  ✓ Extracted URL from JSON object`);
          }
        } catch (e) {
          // Not JSON, check if it contains secure_url as plain text
          const match = member.profile_photo_url.match(/https:\/\/res\.cloudinary\.com\/[^"'\s}]+/);
          if (match) {
            newUrl = match[0];
            console.log(`  ✓ Extracted URL from text`);
          }
        }
        
        if (newUrl) {
          await client.query(`
            UPDATE members 
            SET profile_photo_url = $1, updated_at = NOW()
            WHERE id = $2
          `, [newUrl, member.id]);
          
          console.log(`  ✅ Fixed: ${newUrl}\n`);
          fixed++;
        } else {
          // Set to placeholder if we can't extract URL
          const placeholderUrl = 'https://ui-avatars.com/api/?name=' + 
            encodeURIComponent(`${member.first_name} ${member.last_name}`) + 
            '&size=200&background=7c3aed&color=fff';
          
          await client.query(`
            UPDATE members 
            SET profile_photo_url = $1, updated_at = NOW()
            WHERE id = $2
          `, [placeholderUrl, member.id]);
          
          console.log(`  ⚠️  Could not extract URL, set placeholder\n`);
          failed++;
        }
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}\n`);
        failed++;
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Fixed: ${fixed} photos`);
    console.log(`⚠️  Failed: ${failed} photos`);
    console.log(`📊 Total: ${members.length} photos processed`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (fixed > 0) {
      console.log('🎉 Success! All broken photos have been fixed.');
      console.log('🔄 Please refresh the dashboard to see the updated photos.');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixAllBrokenPhotos();
