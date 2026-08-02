# Backend API Updates Summary

## Overview
Complete backend implementation with permissions system, profile management, contact form handling, and file upload requirements.

---

## 🔐 New Routes Added

### 1. **Permissions API** (`/api/permissions`)
Manage granular permissions for sub-admins.

- `GET /api/permissions` - Get all 24 permissions grouped by category
- `GET /api/permissions/user/:userId` - Get user's permissions
- `POST /api/permissions/grant` - Grant permissions to user
  ```json
  { "userId": "uuid", "permissionIds": ["uuid1", "uuid2"] }
  ```
- `DELETE /api/permissions/revoke` - Revoke permission

**Permission Categories:**
- Members (5): view, create, edit, delete, approve
- Finance (5): view, create, edit, delete, reports
- Choir (3): view, manage, events
- Content (5): announcements, events, gallery, cms, hero
- Reports (2): view, export
- Leadership (1): manage
- Settings (3): view, edit, users

---

### 2. **Sub-Admin Management** (`/api/subadmin`)
Create and manage sub-admins with custom permissions.

- `GET /api/subadmin` - List all sub-admins
- `POST /api/subadmin` - Create new sub-admin
  ```json
  {
    "email": "admin@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+233200000000",
    "role": "leader",  // leader, deacon, elder, pastor, admin
    "gender": "Male",
    "dateOfBirth": "1990-01-01",
    "permissions": ["perm-id-1", "perm-id-2"]
  }
  ```
  - Automatically sends email with setup password link
  - Returns user details

- `PUT /api/subadmin/:id` - Update sub-admin
- `DELETE /api/subadmin/:id` - Deactivate sub-admin

---

### 3. **Hero Slider Management** (`/api/hero`)
Manage homepage hero slides with image uploads.

- `GET /api/hero` - Public: Get active slides
- `GET /api/hero/all` - Admin: Get all slides
- `POST /api/hero` - Create slide (requires image file upload)
  ```
  FormData:
  - image: File (required)
  - title: string
  - subtitle: string
  - ctaLabel: string
  - ctaUrl: string
  - sortOrder: number
  - isActive: boolean
  ```

- `PUT /api/hero/:id` - Update slide (optional new image)
- `DELETE /api/hero/:id` - Delete slide (removes from Cloudinary)
- `PATCH /api/hero/:id/toggle` - Toggle active status
- `PATCH /api/hero/reorder` - Reorder slides
  ```json
  { "slideIds": ["id1", "id2", "id3"] }
  ```

---

### 4. **Profile Management** (`/api/profile`)
User profile settings and updates.

- `GET /api/profile` - Get current user's full profile
- `PUT /api/profile` - Update profile (with optional photo upload)
  ```
  FormData:
  - profilePhoto: File (optional)
  - firstName: string
  - middleName: string
  - lastName: string
  - gender: string
  - dateOfBirth: date
  - phone: string
  - whatsappNumber: string
  - address: string
  - city: string
  - occupation: string
  - maritalStatus: string
  - baptismStatus: boolean
  - baptismDate: date
  - emergencyName: string
  - emergencyPhone: string
  - emergencyRelation: string
  - bio: text
  ```

- `PUT /api/profile/password` - Change password
  ```json
  {
    "currentPassword": "oldpass",
    "newPassword": "newpass123"
  }
  ```

---

### 5. **Contact Messages** (`/api/contact`)
Manage contact form submissions.

- `POST /api/contact` - Public: Submit contact message
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+233200000000",
    "subject": "Inquiry",
    "message": "Message text",
    "churchId": "uuid"
  }
  ```

- `GET /api/contact` - Admin: Get all messages (paginated)
  - Query params: `status`, `search`, `page`, `limit`
  - Status filters: `unread`, `read`, `replied`, `pending`

- `GET /api/contact/stats` - Get message statistics
  ```json
  {
    "total": 50,
    "unread": 10,
    "pending": 15,
    "replied": 35,
    "thisWeek": 8,
    "thisMonth": 25
  }
  ```

- `GET /api/contact/:id` - Get single message
- `PATCH /api/contact/:id/read` - Mark as read
- `PATCH /api/contact/:id/reply` - Mark as replied
- `DELETE /api/contact/:id` - Delete message
- `PATCH /api/contact/bulk/read` - Mark multiple as read
- `DELETE /api/contact/bulk/delete` - Delete multiple messages

---

## 🔄 Updated Routes

### 1. **Auth Routes** (`/api/auth`)

**Updated:**
- `POST /api/auth/register` - Now requires:
  - Profile photo (file upload) - **REQUIRED**
  - First name, last name, email - **REQUIRED**
  - Phone number - **REQUIRED**
  - Gender - **REQUIRED**
  - Date of birth - **REQUIRED**
  - Address - **REQUIRED**
  - Voice group (for choir members) - **REQUIRED**

**New:**
- `GET /api/auth/validate-token` - Validate account setup token
  - Query: `token`
  - Returns: `{ valid: boolean, email: string }`

---

### 2. **Content Routes** (`/api/`)

All image-related endpoints now require file uploads instead of URLs:

**Announcements:**
- `POST /api/announcements` - Image upload via `image` field (optional)
- `PUT /api/announcements/:id` - Image upload replaces old image

**Activities/Events:**
- `POST /api/activities` - Image upload via `image` field (optional)

**Gallery:**
- `POST /api/gallery` - Image upload **REQUIRED**
- `DELETE /api/gallery/:id` - Deletes image from Cloudinary

---

## 📋 Database Changes

### New Tables:

1. **permissions**
   ```sql
   id, code, name, description, category, created_at
   ```

2. **user_permissions**
   ```sql
   id, user_id, permission_id, granted_by, granted_at
   ```

### Updated Tables:

1. **members**
   - Added 'admin' to `membership_status` CHECK constraint
   - Now allows: visitor, new_convert, member, choir_member, leader, pastor, elder, deacon, **admin**

---

## 🔑 Required Fields Summary

### Member/Choir Registration:
- ✅ Profile Photo (file upload)
- ✅ First Name
- ✅ Last Name
- ✅ Email
- ✅ Phone Number
- ✅ Gender
- ✅ Date of Birth
- ✅ Address
- ✅ Voice Group (choir only)

### Hero Slide:
- ✅ Image (file upload)

### Gallery Item:
- ✅ Image (file upload)

### Sub-Admin Creation:
- ✅ Email
- ✅ First Name
- ✅ Last Name

---

## 🖼️ Image Upload Behavior

All image uploads now go to **Cloudinary** in organized folders:
- `profiles/` - User profile photos
- `hero-slides/` - Homepage hero slider images
- `announcements/` - Announcement images
- `activities/` - Event/activity images
- `gallery/` - Gallery images
- `leadership/` - Leadership photos

**Features:**
- Automatic old image deletion when replacing
- Secure upload with transformation options
- CDN delivery for fast loading

---

## 🔐 Permission Middleware

New middleware available: `hasPermission(code)`

Example usage:
```javascript
const { hasPermission } = require('./routes/permissions');

router.post('/members', 
  authenticate, 
  hasPermission('members.create'), 
  async (req, res) => {
    // Only users with 'members.create' permission can access
  }
);
```

**Note:** Admins and superadmins automatically have all permissions.

---

## 📧 Email Notifications

### Sub-Admin Creation:
When admin creates sub-admin, automatic email sent with:
- Welcome message
- Role information
- Password setup link (expires in 7 days)
- Login email

---

## 🚀 Next Steps for Frontend

1. **Run SQL script** in Supabase to create your admin account
2. **Create frontend pages:**
   - Profile Settings Page (all users)
   - Contact Messages Dashboard (admin)
   - Sub-Admin Management (admin)
   - Hero Slider Management (admin)
   - Update registration forms to include file uploads

3. **Update existing pages:**
   - Add photo upload to registration forms
   - Replace URL inputs with file uploads
   - Add profile settings link to user dashboard

---

## 🔧 Environment Variables Required

Ensure these are set in Render:
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
FRONTEND_URL=https://your-vercel-app.vercel.app
CLOUDINARY_CLOUD_NAME=fxyhv4g3
CLOUDINARY_API_KEY=351477939867254
CLOUDINARY_API_SECRET=kaoSgxoFBqtUMrhPrHrkYY2Mw5o
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

---

## ✅ Testing Checklist

- [ ] Create admin account in Supabase
- [ ] Login as admin
- [ ] Create sub-admin and verify email sent
- [ ] Sub-admin sets password and logs in
- [ ] Test profile photo upload
- [ ] Submit contact form and verify it appears in admin
- [ ] Upload hero slide image
- [ ] Upload announcement with image
- [ ] Upload gallery image
- [ ] Register new member with required fields and photo
- [ ] Test permission-based access control

---

## 📝 API Response Formats

### Success Response:
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

### Error Response:
```json
{
  "error": "Error message description"
}
```

### Paginated Response:
```json
{
  "items": [ ... ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

---

## 🎯 Key Features Implemented

✅ Granular permission system (24 permissions)
✅ Sub-admin creation with custom permissions
✅ Profile settings with photo upload
✅ Contact form with admin management
✅ Hero slider with image upload
✅ Required fields validation on registration
✅ Profile photo required for registration
✅ File uploads replace URL inputs
✅ Automatic Cloudinary cleanup on delete/replace
✅ Email notifications for sub-admins
✅ Token-based password setup
✅ Bulk operations for contact messages

---

All backend changes are now live on Render and ready for frontend integration!
