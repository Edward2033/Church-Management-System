# CMS Admin Guide - Managing Your Church Website

## ✅ All Fixed Issues

### Image Uploads
- ✅ All images now upload correctly to Cloudinary
- ✅ Image URLs are saved properly (no more `[object Object]`)
- ✅ Profile photos, gallery, announcements, hero slides all working

### Real Data vs Demo Data
- ✅ Homepage fetches hero slides from `/api/hero`
- ✅ Announcements fetch from `/api/announcements`
- ✅ Activities fetch from `/api/activities`
- ✅ Gallery fetches from `/api/gallery`
- ✅ Only shows fallback demo data if API fails (graceful degradation)

---

## 🎯 How to Manage Your Website Content

### 1. Hero Slider (Homepage Banner)
**Location:** Admin Dashboard → Hero Slider

**Features:**
- Upload banner images for the homepage hero section
- Add title, subtitle, and call-to-action button
- Reorder slides by dragging
- Toggle slides active/inactive
- Multiple slides will auto-rotate

**To Add a New Hero Slide:**
1. Go to Admin Dashboard
2. Click "Hero Slider" in the navigation
3. Click "Add New Slide"
4. Upload an image (required)
5. Add title and subtitle (optional)
6. Add CTA label and URL (optional)
7. Set sort order
8. Click "Save"

**Result:** The slide will appear on the homepage immediately!

---

### 2. Announcements
**Location:** Admin Dashboard → Announcements

**Features:**
- Create church-wide announcements
- Add images to announcements
- Pin important announcements to the top
- Set category (church, choir, events, general)
- Set expiration dates

**To Create an Announcement:**
1. Go to Admin Dashboard → Announcements
2. Click "Create Announcement"
3. Add title and content
4. Upload an image (optional but recommended)
5. Select category
6. Check "Pinned" if it should stay at the top
7. Set expiration date (optional)
8. Click "Save"

**Result:** Announcement appears on:
- Homepage (latest 3)
- Announcements page (all)
- Member dashboards

---

### 3. Activities/Events
**Location:** Admin Dashboard → Activities

**Features:**
- Create church activities and events
- Add event images
- Set date, time, and location
- Specify if registration is required
- Set audience (all, members, choir, youth)

**To Create an Activity:**
1. Go to Admin Dashboard → Activities
2. Click "Create Activity"
3. Add title and description
4. Upload an image (optional)
5. Set event date and time
6. Add location
7. Select category
8. Click "Save"

**Result:** Activity appears on:
- Homepage (upcoming 3)
- Activities page (all)
- Member calendars

---

### 4. Gallery
**Location:** Admin Dashboard → Gallery

**Features:**
- Upload church event photos
- Organize by category
- Set sort order
- Add captions

**To Add Gallery Images:**
1. Go to Admin Dashboard → Gallery
2. Click "Upload Image"
3. Select image from device
4. Add title and caption
5. Select category
6. Click "Upload"

**Result:** Images appear on the Gallery page immediately!

---

### 5. Members Management
**Location:** Admin Dashboard → Members

**Features:**
- View all registered members
- Approve/reject new registrations
- Create members manually
- Print registration forms with QR codes
- Export member lists

**To Manually Create a Member:**
1. Go to Admin Dashboard → Members
2. Click "Create User"
3. Fill in all required fields:
   - Profile photo (required)
   - First name, last name, email
   - Phone, gender, date of birth, address
4. Select role (member, choir member, admin)
5. For choir members, select voice group
6. Click "Create User"

**Result:** 
- Member account created immediately
- Email sent with password setup link
- Member can log in after setting password

**To Print a Registration Form:**
1. Go to Admin Dashboard → Members
2. Click the eye icon on any member
3. Click "Print Registration"
4. Form includes:
   - Member photo and details
   - QR code for verification
   - Signature areas for Pastor and Choir Director

---

### 6. Sub-Admin Management
**Location:** Admin Dashboard → Sub-Admins

**Features:**
- Create sub-admin accounts
- Assign granular permissions
- Control what each sub-admin can access
- Sub-admins receive email with login link

**Permission Categories:**
- Members management
- Finance access
- Choir management
- Content (CMS)
- Reports viewing
- Leadership management
- Settings control

---

### 7. Profile Management
**Location:** Any Dashboard → Profile

**Features:**
- Update personal information
- Upload/change profile photo
- Update contact details
- Change password

**All Users Can:**
- View their profile
- Update their information
- Upload a profile photo
- Change their password

---

## 📊 Data Flow Summary

### Homepage:
1. Hero slider → Fetches from `/api/hero`
2. Announcements → Fetches latest 3 from `/api/announcements`
3. Activities → Fetches upcoming 3 from `/api/activities`

### Public Pages:
- **Announcements Page** → `/api/announcements` (all)
- **Activities Page** → `/api/activities` (all)
- **Gallery Page** → `/api/gallery` (all)

### Member Areas:
- Dashboard shows personalized data
- Members can update their profiles
- View announcements and activities
- Choir members see choir-specific content

---

## 🔧 Current System Status

### ✅ Working Features:
- Hero slider management
- Announcements (create, edit, delete, with images)
- Activities (create, edit, delete, with images)
- Gallery (upload, categorize, delete)
- Member registration (with approval workflow)
- Member creation (admin manual creation)
- Profile updates (with photo upload)
- QR code verification
- Printable registration forms
- Sub-admin creation with permissions
- Contact form management

### 🎯 How to Populate Your Site:

**Step 1: Add Hero Slides**
- Go to Admin → Hero Slider
- Upload at least 3-5 banner images
- These will rotate on the homepage

**Step 2: Create Announcements**
- Add current church announcements
- Upload images for visual appeal
- Pin important ones

**Step 3: Add Upcoming Activities**
- Create all upcoming events
- Add dates, times, locations
- Upload event images

**Step 4: Populate Gallery**
- Upload photos from past events
- Organize by category
- Add captions

**Step 5: Manage Members**
- Approve pending registrations
- Create any missing members
- Print registration forms if needed

---

## 🚀 Quick Start for Admin

1. **Log in**: https://your-site.vercel.app/login
   - Email: edwardcole203@gmail.com
   - Password: Admin@123

2. **First Actions:**
   - Add 3-5 hero slides
   - Create 5-10 announcements
   - Add 10-20 upcoming activities
   - Upload 20-50 gallery images

3. **Result:**
   - Homepage will show real hero slides
   - Announcements section will be populated
   - Activities will display
   - Gallery will be full
   - No more demo/fallback data!

---

## 📝 Important Notes:

1. **Images:**
   - All images are stored on Cloudinary
   - Optimal size: 1920x1080 for hero slides, 800x600 for others
   - Formats: JPG, PNG
   - Max size: 10MB

2. **Hero Slides:**
   - At least 1 slide required
   - Recommended: 3-5 slides
   - Auto-rotates every 5 seconds

3. **Announcements:**
   - Images optional but recommended
   - Expiration dates optional
   - Pinned announcements stay at top

4. **Activities:**
   - Event dates required
   - Images optional but recommended
   - Upcoming events show on homepage

5. **Gallery:**
   - Upload high-quality images
   - Add descriptive captions
   - Organize by category

---

## Need Help?

All CMS features are working and connected to the live database. Just log in to the admin dashboard and start adding content!

The website will automatically fetch and display all your real data. No more demo content!
