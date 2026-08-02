# 📸 Cloudinary Integration Guide

## Overview

All images in the LUS4G Church Platform are now stored on Cloudinary instead of local uploads folder. This includes:
- User profile photos
- Gallery images
- Announcement images
- Activity/Event images
- Hero slider images
- Leadership profile photos

---

## ✅ What's Configured

### Backend Configuration

**Environment Variables** (already in `backend/.env`):
```env
CLOUDINARY_URL=cloudinary://351477939867254:kaoSgxoFBqtUMrhPrHrkYY2Mw5o@fxyhv4g3
CLOUDINARY_CLOUD_NAME=fxyhv4g3
CLOUDINARY_API_KEY=351477939867254
CLOUDINARY_API_SECRET=kaoSgxoFBqtUMrhPrHrkYY2Mw5o
```

**Dependencies Installed**:
- `cloudinary` - Cloudinary SDK
- `multer` - File upload middleware

**Cloudinary Helper** (`backend/src/lib/cloudinary.js`):
- `cloudinary` - Configured Cloudinary instance
- `upload` - Multer middleware for file uploads
- `uploadToCloudinary(buffer, folder)` - Upload file buffer to Cloudinary
- `deleteImage(publicId)` - Delete image from Cloudinary

### Upload Folders Structure

Images are organized in Cloudinary folders:
```
lus4g-church/
├── profiles/        # Member & user profile photos
├── gallery/         # Church gallery images
├── announcements/   # Announcement cover images
├── activities/      # Activity/Event images
├── hero-slides/     # Homepage hero slider images
└── leadership/      # Leadership profile photos
```

---

## 🚀 Forgot Password Feature

### What's Added

✅ **Forgot Password Page** (`/forgot-password`)
- User enters email address
- System sends reset link via email
- Link expires in 1 hour

✅ **Reset Password Page** (`/reset-password?token=xxx`)
- User clicks link from email
- Enters new password
- Password must be 8+ characters
- Redirects to login on success

✅ **Updated Login Page**
- Added "Forgot password?" link next to password field

### Routes

**Backend Routes** (already exist in `backend/src/routes/auth.js`):
- `POST /api/auth/forgot-password` - Send reset email
- `POST /api/auth/reset-password` - Reset password with token

**Frontend Routes** (added to `App.tsx`):
- `/forgot-password` - Forgot password form
- `/reset-password` - Reset password form

### Email Template

Password reset emails are sent using the `passwordResetEmail` template in `backend/src/lib/email.js`.

---

## 📋 How to Use Cloudinary in Your Routes

### Example: Upload Announcement Image

```javascript
const { upload, uploadToCloudinary } = require('../lib/cloudinary');

router.post('/announcements', 
  authenticate, 
  requireAdmin, 
  upload.single('image'),  // Multer middleware
  async (req, res) => {
    try {
      let image_url = null;
      
      // If image file was uploaded
      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, 'announcements');
        image_url = result.secure_url;  // Cloudinary URL
      }
      
      const { title, content } = req.body;
      const { rows: [announcement] } = await pool.query(
        `INSERT INTO announcements (church_id, title, content, image_url)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.user.church_id, title, content, image_url]
      );
      
      res.json({ announcement });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
```

### Example: Update Profile Photo

```javascript
router.patch('/members/:id/photo', 
  authenticate, 
  upload.single('photo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No photo provided' });
      }
      
      // Upload to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, 'profiles');
      
      // Update database
      const { rows: [member] } = await pool.query(
        `UPDATE members SET profile_photo_url=$1, updated_at=NOW()
         WHERE id=$2 RETURNING *`,
        [result.secure_url, req.params.id]
      );
      
      res.json({ member });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
```

### Example: Delete Image When Deleting Content

```javascript
const { deleteImage } = require('../lib/cloudinary');

router.delete('/gallery/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    // Get current image URL
    const { rows: [item] } = await pool.query(
      'SELECT image_url FROM gallery WHERE id=$1',
      [req.params.id]
    );
    
    // Delete from database
    await pool.query('DELETE FROM gallery WHERE id=$1', [req.params.id]);
    
    // Delete from Cloudinary (extract public_id from URL)
    if (item?.image_url) {
      const publicId = extractPublicId(item.image_url);
      await deleteImage(publicId);
    }
    
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to extract public_id from Cloudinary URL
function extractPublicId(url) {
  // Example URL: https://res.cloudinary.com/fxyhv4g3/image/upload/v1234567890/lus4g-church/gallery/abc123.jpg
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex !== -1 && parts.length > uploadIndex + 2) {
    // Get everything after version number, remove file extension
    return parts.slice(uploadIndex + 2).join('/').replace(/\.[^.]+$/, '');
  }
  return null;
}
```

---

## 🎨 Frontend: Uploading Images

### Example: Profile Photo Upload Form

```typescript
const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('photo', file);
  
  try {
    const response = await axios.patch(
      `/api/members/${memberId}/photo`,
      formData,
      {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    setProfilePhoto(response.data.member.profile_photo_url);
    toast.success('Photo uploaded!');
  } catch (err) {
    toast.error('Upload failed');
  }
};
```

### Example: Image Upload Button

```tsx
<input
  type="file"
  accept="image/*"
  onChange={handlePhotoUpload}
  className="hidden"
  id="photo-upload"
/>
<label htmlFor="photo-upload" className="btn-primary cursor-pointer">
  <Upload size={16} /> Upload Photo
</label>
```

---

## 🔐 Admin Control of Public Pages

### What Admins Can Manage

✅ **Homepage**:
- Hero slider images (via CMS → Hero Slides)
- Featured announcements (via Announcements)
- Upcoming activities (via Activities)

✅ **About Page**:
- Leadership profiles with photos (via Leadership Management)
- Can update text via CMS Pages (future enhancement)

✅ **Announcements Page**:
- Create/Edit/Delete announcements (via Admin Dashboard → Announcements)
- Upload cover images
- Set categories (church, choir, events, general)
- Pin important announcements
- Set expiry dates

✅ **Activities Page**:
- Create/Edit/Delete activities (via Admin Dashboard → Activities)
- Upload event images
- Set event dates, times, locations
- Set categories (worship, choir, outreach, youth, etc.)

✅ **Gallery Page**:
- Upload/Delete photos (via Admin Dashboard → Gallery)
- Organize by categories
- Set sort order

✅ **Contact Page**:
- View submitted messages (via Admin Dashboard)
- Update church contact info via CMS Settings

---

## 📊 Image Specifications

### Recommended Image Sizes

| Content Type | Recommended Size | Max File Size |
|-------------|------------------|---------------|
| Profile Photos | 400x400px | 5MB |
| Gallery Images | 1200x800px | 10MB |
| Hero Slides | 1920x1080px | 10MB |
| Announcement Images | 1200x600px | 5MB |
| Activity Images | 1200x600px | 5MB |
| Leadership Photos | 600x600px | 5MB |

### Automatic Transformations

Cloudinary automatically:
- Limits images to max 1200x1200px
- Converts to optimal format (WebP when supported)
- Compresses for faster loading
- Generates thumbnails

---

## 🚀 Deployment with Cloudinary

### Render.com Environment Variables

Add these to your Render backend environment variables:

```
CLOUDINARY_URL=cloudinary://351477939867254:kaoSgxoFBqtUMrhPrHrkYY2Mw5o@fxyhv4g3
CLOUDINARY_CLOUD_NAME=fxyhv4g3
CLOUDINARY_API_KEY=351477939867254
CLOUDINARY_API_SECRET=kaoSgxoFBqtUMrhPrHrkYY2Mw5o
```

### Vercel (Frontend)

No Cloudinary configuration needed on frontend - images are fetched via HTTPS URLs.

---

## ✅ Testing Cloudinary Integration

### Test Upload

```bash
curl -X POST http://localhost:5000/api/test-upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

### Test Image URL

After upload, you should get a URL like:
```
https://res.cloudinary.com/fxyhv4g3/image/upload/v1234567890/lus4g-church/gallery/abc123.jpg
```

### Verify in Cloudinary Dashboard

1. Go to https://cloudinary.com/console
2. Login with your account
3. Go to Media Library
4. You should see folders: `lus4g-church/profiles`, `lus4g-church/gallery`, etc.

---

## 🔧 Troubleshooting

### Issue: Upload fails with "Invalid credentials"

**Solution**: Check environment variables are set correctly in Render dashboard.

### Issue: Image URL not displaying

**Solution**: Ensure the `image_url` field is being returned from the API and the frontend is using the correct URL.

### Issue: Large images cause timeout

**Solution**: Images are automatically resized to 1200x1200px max. If still timing out, reduce file size before uploading.

### Issue: Old local uploads folder still exists

**Solution**: The `uploads/` folder is now unused. You can remove it or keep it for backwards compatibility. New uploads go to Cloudinary.

---

## 📝 Migration from Local Uploads

If you have existing images in `uploads/` folder:

1. **Manually upload** existing images to Cloudinary via dashboard
2. **Update database** with new Cloudinary URLs:
   ```sql
   UPDATE gallery 
   SET image_url = 'https://res.cloudinary.com/fxyhv4g3/image/upload/...'
   WHERE id = 'xxx';
   ```
3. **Or create migration script** to bulk upload (contact developer)

---

## 🎉 Summary

✅ **Cloudinary Integration**: Complete  
✅ **Forgot Password**: Implemented  
✅ **Admin Control**: Full control of all public content  
✅ **Image Management**: Centralized on Cloudinary  
✅ **Email Notifications**: Working  

**Next Steps**:
1. Test forgot password flow
2. Test image uploads in admin dashboard
3. Deploy to production with Cloudinary environment variables

---

**Cloudinary Dashboard**: https://cloudinary.com/console/c-d9c85c2c6a1e4f4ebbcba8eaa1b5f8  
**Cloud Name**: fxyhv4g3  
**Contact**: edwardcole203@gmail.com
