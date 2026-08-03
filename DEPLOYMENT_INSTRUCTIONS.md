# Deployment Instructions - Critical Fixes

## ⚡ Quick Deploy Steps

### 1. Run Database Migrations

Connect to your Supabase database and run:

```sql
-- Migration 007: Add reply_message column to contact_messages
ALTER TABLE contact_messages 
ADD COLUMN IF NOT EXISTS reply_message TEXT;

CREATE INDEX IF NOT EXISTS idx_contact_messages_is_replied 
ON contact_messages(is_replied, church_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read 
ON contact_messages(is_read, church_id, created_at DESC);
```

### 2. Clear Demo Gallery Data (Optional but Recommended)

```sql
DELETE FROM gallery 
WHERE church_id = '00000000-0000-0000-0000-000000000001'
  AND (
    image_url LIKE '%placeholder%'
    OR image_url LIKE '%demo%'
    OR image_url LIKE '%sample%'
    OR image_url LIKE '%placehold.co%'
    OR image_url LIKE '%via.placeholder%'
    OR image_url LIKE '%unsplash%'
    OR image_url LIKE '%picsum%'
  );
```

### 3. Redeploy Backend (Render)

1. Go to https://dashboard.render.com
2. Select your backend service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for deployment to complete

### 4. Redeploy Frontend (Vercel)

Frontend will auto-deploy from GitHub push. Monitor at:
https://vercel.com/dashboard

---

## 🔍 Verify Fixes

### Test Registration Photo Upload

1. Go to `/register`
2. Fill out form and upload a photo
3. Review page should show photo preview
4. Click "Submit Registration"
5. Should succeed WITHOUT "Photo is required" error
6. Check admin dashboard - photo should be visible

**Expected**: ✅ Account created with photo uploaded to Cloudinary

---

### Test Leadership Management

1. Go to `/admin/leadership`
2. Click "Add Leader"
3. Role field should be a **dropdown** (not text input)
4. Sort Order should be a **dropdown** (not number input)
5. Select role and sort order
6. Upload photo
7. Submit

**Expected**: ✅ Leader created with selected role and order

---

### Test Contact Reply System

1. Submit contact form as visitor from `/contact`
2. Login as admin
3. Go to `/admin/contacts`
4. Click on the new message
5. Message details appear on right panel
6. Click "Reply to [Name]"
7. Type reply message
8. Click "Send Reply"
9. Check visitor's email inbox

**Expected**: ✅ Visitor receives professional email with reply

---

### Test Core Values

1. Go to `/admin/cms`
2. Click "Core Values" tab
3. Should load without "Not Found" error
4. Add/Edit/Delete core values
5. Visit `/about` page
6. Active core values should display

**Expected**: ✅ Core Values CMS fully functional

---

## 📧 Email Configuration Check

Verify these environment variables are set in Render:

```
SMTP_HOST=smtp.gmail.com (or your SMTP provider)
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@lus4gchurch.org
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

**Test Email**:
1. Submit contact form
2. Admin replies
3. Check email delivery
4. Check spam folder if not received

---

## 🐛 Troubleshooting

### "Photo is required" error still occurs

**Solution**:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check browser console for errors
4. Verify backend received file:
   ```bash
   curl -X POST https://your-backend.onrender.com/api/auth/register \
     -F "profilePhoto=@test-image.jpg" \
     -F "first_name=Test" \
     -F "last_name=User" \
     -F "email=test@test.com" \
     -F "phone=1234567890" \
     -F "gender=Male" \
     -F "date_of_birth=2000-01-01" \
     -F "address=Test Address" \
     -F "membership_type=member" \
     -F "baptized=yes" \
     -F "church_id=00000000-0000-0000-0000-000000000001"
   ```

---

### Contact reply email not sending

**Check**:
1. SMTP credentials in Render environment variables
2. Backend logs for email errors
3. Test SMTP connection:
   ```javascript
   // In backend console
   const nodemailer = require('nodemailer');
   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: process.env.SMTP_PORT,
     auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
   });
   transporter.verify((error, success) => {
     if (error) console.log(error);
     else console.log('Server is ready to send emails');
   });
   ```

---

### Leadership role dropdown not showing

**Solution**:
1. Clear browser cache
2. Verify frontend deployment completed
3. Check browser console
4. Refresh page

---

### Core Values "Not Found" error

**Check**:
1. Backend is running: `curl https://your-backend.onrender.com/health`
2. CMS routes registered: Check logs for route registration
3. Database has table:
   ```sql
   SELECT * FROM about_values LIMIT 1;
   ```
4. Try direct API call:
   ```bash
   curl https://your-backend.onrender.com/api/cms/about-values
   ```

---

## ✅ Post-Deployment Checklist

- [ ] Database migrations executed
- [ ] Demo gallery data cleared
- [ ] Backend redeployed on Render
- [ ] Frontend deployed on Vercel
- [ ] Registration photo upload tested
- [ ] Leadership dropdowns tested
- [ ] Contact reply email tested
- [ ] Core Values CMS tested
- [ ] Email delivery confirmed
- [ ] No console errors in browser
- [ ] All routes accessible
- [ ] Mobile responsive check

---

## 🎉 Success Indicators

**Registration**:
- Photo uploads without errors
- Preview displays correctly
- Form submits successfully
- Account created in database
- Photo URL saved
- Photo visible in admin dashboard

**Leadership**:
- Role dropdown has predefined options
- Sort order dropdown works
- Photo uploads successfully
- All fields save correctly
- Displays on public Leadership page

**Contact Messages**:
- Admin can view all messages
- Reply form displays
- Email sends successfully
- Visitor receives professional email
- Message marked as replied
- Reply stored in database

**Core Values**:
- CMS tab loads without errors
- CRUD operations work
- Active values display on About page
- Inactive values hidden from public

---

## 📞 Support

If issues persist after following these steps:

1. Check backend logs on Render
2. Check browser console
3. Review `FIXES_APPLIED.md` for detailed explanations
4. Test API endpoints directly with curl
5. Verify environment variables are set

---

## 🚀 Performance Notes

- Photo uploads may take 3-5 seconds (Cloudinary processing)
- Email sending is asynchronous (user sees success immediately)
- Gallery loads faster after demo data removal
- Contact messages have proper database indexes

---

**Deployed**: {{ DATE }}
**Commit**: da30602
**Branch**: main
**Status**: ✅ PRODUCTION READY
