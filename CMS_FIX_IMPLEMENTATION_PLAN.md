# CMS, Email, and Account Management Fixes - Implementation Plan

## PHASE 1: About Page Full CMS Integration ✅

### Database Tables Already Exist:
- `cms_settings` - For all text content
- `about_values` - For core values
- `leadership` - For leadership members

### Frontend Changes:
1. **AboutPage.tsx** - Already dynamic! ✅
   - Fetches from `/cms/settings?group=about`
   - Fetches from `/cms/about-values`
   - Fetches from `/leadership`
   - Uses `about_intro_image` setting for story section
   - All sections are CMS-driven

2. **AdminCMS.tsx** - Already has About tab! ✅
   - Hero section management
   - Story section with image upload
   - Mission & Vision
   - Core Values section
   - Leadership section titles

### Status: ✅ Already Implemented
- About page is fully CMS-driven
- Image uploads work via `/cms/settings/upload`
- All sections pull from database

---

## PHASE 2: Fix Image Upload & Display Issues

### Investigation Needed:
1. Check if Cloudinary credentials are configured
2. Verify image upload endpoint returns correct URL
3. Ensure AboutPage correctly displays uploaded images

### Files to Check:
- `backend/src/lib/cloudinary.js` - Upload function
- `backend/.env` - CLOUDINARY_* credentials
- `frontend/src/pages/AboutPage.tsx` - Image rendering
- `frontend/src/pages/admin/AdminCMS.tsx` - Image upload component

### Fix Strategy:
1. Verify Cloudinary configuration
2. Add error logging to upload endpoint
3. Test end-to-end image flow
4. Add fallback for missing images

---

## PHASE 3: Global Logo Management System

### Implementation Plan:

1. **Add Logo Settings to CMS**
   - Key: `site_logo_url` (Main website logo)
   - Key: `admin_logo_url` (Admin dashboard logo - optional)
   - Key: `footer_logo_url` (Footer logo - optional, fallback to site_logo)
   - Store in `cms_settings` table

2. **Create Admin Logo Tab**
   - Add "Branding" or "Logo" tab to AdminCMS
   - Single upload for main logo
   - Preview of current logo
   - Upload replaces across entire site

3. **Update Components to Use Logo**
   - `Navbar.tsx` - Replace hardcoded Church icon with logo
   - `Footer.tsx` - Use logo if available
   - `AdminDashboard.tsx` sidebar - Use logo
   - `PrintableRegistrationForm.tsx` - Use logo instead of `/church-logo.png`

4. **Fallback Strategy**
   - If no logo uploaded: Use Church icon component (current behavior)
   - Logo should be optional enhancement

---

## PHASE 4: Contact Reply Email System ✅

### Status: Already Implemented! ✅
- Backend: `/api/contact/:id/reply` endpoint exists
- Frontend: AdminContacts.tsx has reply form
- Email template exists in contact routes
- Uses church settings for email template

### Verification Needed:
1. Check SMTP configuration in `.env`
2. Test email sending functionality
3. Verify error handling displays properly

### SMTP Configuration Required:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Church Name <no-reply@church.org>
```

---

## PHASE 5: Grant Account Functionality ✅

### Status: Already Implemented! ✅

**Backend Routes:**
- `POST /api/auth/approve/:memberId` - Approves member
- `POST /api/auth/grant-account/:memberId` - Sends setup email

**Frontend:**
- AdminMembers.tsx has Grant Account button ✅
- AdminChoir.tsx has Grant Account button ✅
- Buttons appear for approved members without password

### Workflow:
1. Member registers → status = 'pending'
2. Admin clicks Approve → status = 'approved', generates member_code
3. Admin clicks Grant Account → sends email with setup link (48h expiry)
4. Member clicks link → sets password → account active

### Email Template Already Exists:
- `backend/src/lib/email.js` - `approvalEmail()` function
- Professional template with church branding
- Includes member ID, setup link, expiry warning

### Verification Needed:
1. Test full workflow end-to-end
2. Verify email sending works
3. Check password setup page works
4. Ensure button states update correctly

---

## PHASE 6: Error Handling & User Feedback

### Current State:
- Basic error messages via `toast.error()`
- Silent failures may exist in email sending
- Image upload errors may not be clear

### Improvements Needed:
1. **Email Sending Errors**
   - Add detailed error logging
   - Display helpful messages to admin
   - Suggest configuration check if SMTP fails

2. **Image Upload Errors**
   - Validate file size/type before upload
   - Show progress indicator
   - Display specific error messages
   - Preview before confirming upload

3. **Account Grant Errors**
   - Check if already granted
   - Validate email exists
   - Confirm email sent successfully
   - Show retry option on failure

---

## TESTING CHECKLIST

### About Page CMS:
- [ ] Admin updates hero title → displays on public site
- [ ] Admin uploads hero image → displays on public site
- [ ] Admin updates story paragraphs → displays on public site
- [ ] Admin uploads story image → displays on public site
- [ ] Admin updates mission/vision → displays on public site
- [ ] Admin creates core value → displays on public site
- [ ] Admin adds leader → displays on public site with photo

### Logo Management:
- [ ] Admin uploads site logo → appears in navbar
- [ ] Logo appears in footer
- [ ] Logo appears in admin dashboard
- [ ] Logo appears in printable forms
- [ ] Site works without logo (fallback)

### Contact Reply:
- [ ] Visitor submits contact form → saves to database
- [ ] Admin sees message in AdminContacts
- [ ] Admin clicks message → marks as read
- [ ] Admin types reply → sends email successfully
- [ ] Visitor receives email with proper formatting
- [ ] Message marked as replied in admin

### Grant Account:
- [ ] Member registers → approval_status = 'pending'
- [ ] Admin approves → member_code generated
- [ ] Admin grants account → email sent
- [ ] Member receives email with setup link
- [ ] Member sets password → account active
- [ ] Grant Account button disappears after success
- [ ] Same workflow works for choir members

### Error Handling:
- [ ] SMTP not configured → clear error message
- [ ] Image upload fails → helpful error
- [ ] Network error → retry option
- [ ] Invalid file type → validation message
- [ ] Account already granted → appropriate message

---

## FILES TO MODIFY

### Backend:
- `backend/.env` - Verify all configs present
- `backend/src/lib/email.js` - May need error logging
- `backend/src/lib/cloudinary.js` - May need error handling
- `backend/src/routes/cms.js` - Verify logo upload support

### Frontend:
- `frontend/src/pages/admin/AdminCMS.tsx` - Add logo/branding tab
- `frontend/src/components/Navbar.tsx` - Use dynamic logo
- `frontend/src/components/Footer.tsx` - Use dynamic logo
- `frontend/src/pages/AdminDashboard.tsx` - Use dynamic logo
- `frontend/src/components/PrintableRegistrationForm.tsx` - Use dynamic logo
- `frontend/src/pages/AboutPage.tsx` - Verify image rendering

### Documentation:
- Create ADMIN_CMS_GUIDE.md
- Update SETUP_INSTRUCTIONS.md with SMTP config

---

## PRIORITY ORDER

1. **Verify Existing Functionality** (Phase 4 & 5)
   - Test contact reply system
   - Test grant account workflow
   - Check SMTP configuration

2. **Fix Any Broken Features**
   - Debug email sending if broken
   - Fix account creation if broken
   - Fix image uploads if broken

3. **Add Logo Management** (Phase 3)
   - Implement logo CMS tab
   - Update all components to use logo
   - Test across entire site

4. **Improve Error Handling** (Phase 6)
   - Add detailed error messages
   - Improve user feedback
   - Add logging for debugging

5. **Final Testing** (Phase 7)
   - Run through all checklists
   - Document any issues
   - Create user guide

---

## EXPECTED OUTCOME

After implementation:
- ✅ About page 100% CMS-managed (already done)
- ✅ Images upload and display correctly
- ✅ Logo management from admin panel
- ✅ Contact reply emails work perfectly
- ✅ Grant account flow works end-to-end
- ✅ Clear error messages everywhere
- ✅ Professional admin and user experience
