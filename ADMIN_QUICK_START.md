# Admin Quick Start Guide - Church Management Platform

## 🎯 Quick Access

### Admin Login:
- **URL**: Your deployed frontend URL + `/login`
- **Email**: edwardcole203@gmail.com
- **Password**: Your admin password

### Admin Dashboard:
- **URL**: `/admin`

---

## 📋 CMS Management Quick Guide

### 1. Homepage Content
**Location**: Admin Dashboard → Homepage

Manage all homepage sections:
- Hero Slider (images, titles, CTAs)
- Welcome Section
- Statistics
- Features (Why Join Us)
- Service Times
- Featured Content (Announcements/Events)
- Call to Action sections

### 2. About Page Content
**Location**: Admin Dashboard → CMS Settings → About Page

Manage:
- Hero section (title, subtitle, background image)
- Our Story section (paragraphs, images)
- Mission & Vision statements
- Core Values section headings
- Leadership section headings

### 3. Core Values
**Location**: Admin Dashboard → CMS Settings → Core Values

Add/Edit/Delete core values:
- Title
- Description
- Color theme (Purple, Amber, Blue, Green, Rose, Teal)
- Sort order
- Active/Inactive toggle

### 4. Contact Page
**Location**: Admin Dashboard → CMS Settings → Contact Page

Manage all contact page content:
- Page header (title, subtitle, description)
- Contact information (address, phone, email, office hours)
- Sunday service times (3 services)
- Midweek services (Bible Study, Prayer Meeting)
- Form settings (enable/disable, success message)

### 5. Footer
**Location**: Admin Dashboard → CMS Settings → Footer

Manage footer across all pages:
- Church info (name, tagline, description)
- Contact details (address, city, phone, email)
- Service times (Sunday, Wednesday, Friday)
- Ministries list (pipe-separated: "Choir|Youth|Outreach")
- Copyright text

### 6. Social Media Links
**Location**: Admin Dashboard → CMS Settings → Social Media

Add social media URLs:
- Facebook
- Instagram
- Twitter/X
- YouTube
- TikTok
- WhatsApp

Leave blank to hide icons in footer.

### 7. Contact Messages
**Location**: Admin Dashboard → Contact Messages

Manage visitor contact form submissions:
- View all messages
- Mark as read/unread
- Reply to visitors (sends email)
- Delete messages
- Filter by status (unread, read, replied, pending)

### 8. Members Management
**Location**: Admin Dashboard → Members

Manage church members:
- View all members
- Approve pending registrations
- Edit member information
- View member details
- Search and filter members

### 9. Announcements
**Location**: Admin Dashboard → Announcements

Create/Edit/Delete announcements:
- Title and content
- Category (church, choir, events, general)
- Image upload
- Pin to top
- Active/Inactive toggle
- Audience targeting

### 10. Activities/Events
**Location**: Admin Dashboard → Activities

Manage church events:
- Title and description
- Category (church, choir, worship, outreach, youth)
- Date, time, location
- Image upload
- Registration requirements
- Active/Inactive toggle

### 11. Gallery
**Location**: Admin Dashboard → Gallery

Manage photo gallery:
- Upload images
- Add title and caption
- Categorize (events, choir, worship, youth, general)
- Set sort order
- Delete images

### 12. Hero Slider
**Location**: Admin Dashboard → Hero Slider

Manage homepage hero slides:
- Upload slide images
- Add title and subtitle
- Add CTA button (label + URL)
- Set sort order
- Active/Inactive toggle
- Reorder slides

### 13. Leadership
**Location**: Admin Dashboard → Leadership

Manage church leadership profiles:
- Upload photo
- Name and title/role (dropdown: Pastor, Elder, Deacon, etc.)
- Bio/Description
- Sort order (dropdown 0-10)
- Active/Inactive toggle

---

## 🎨 CMS Changes Reflect Immediately

All CMS changes reflect immediately on the public website:
- ✅ Footer updates appear on ALL pages
- ✅ Contact page updates appear immediately
- ✅ About page updates appear immediately
- ✅ Homepage updates appear immediately
- ✅ No cache clearing needed
- ✅ No server restart needed

---

## 🔧 Recommended First-Time Setup

### Step 1: Configure Footer (applies to all pages)
1. Go to CMS Settings → Footer
2. Update church name, address, phone, email
3. Update service times
4. Add ministries list
5. Save

### Step 2: Configure Social Media
1. Go to CMS Settings → Social Media
2. Add your social media URLs
3. Save

### Step 3: Configure Contact Page
1. Go to CMS Settings → Contact Page
2. Update contact information
3. Update service times for contact page display
4. Customize form success message
5. Save

### Step 4: Configure About Page
1. Go to CMS Settings → About Page
2. Update story, mission, vision
3. Upload images
4. Save

### Step 5: Add Core Values
1. Go to CMS Settings → Core Values
2. Click "Add Value"
3. Add your church's core values
4. Save each one

### Step 6: Configure Homepage
1. Go to Homepage
2. Upload hero slider images
3. Configure welcome section
4. Add statistics
5. Configure featured content
6. Save all sections

### Step 7: Add Content
1. Add announcements
2. Add activities/events
3. Upload gallery images
4. Add leadership profiles

---

## 📞 Contact Message Workflow

### When a visitor submits the contact form:
1. Message saved in database
2. Appears in Admin → Contact Messages
3. Shows as "Unread"

### Admin Response Workflow:
1. Click on message to view details
2. Click "Reply" button
3. Type response
4. Click "Send Reply"
5. Visitor receives email with your response
6. Message marked as "Replied"

**Email Template Includes**:
- Church name and branding
- Original visitor message
- Your admin response
- Church contact information

---

## 🎯 Common Admin Tasks

### Update Church Contact Info:
1. Go to CMS Settings → Footer
2. Update address, phone, email
3. Save → Changes appear on ALL pages

### Change Service Times:
1. Go to CMS Settings → Footer (for footer display)
2. Go to CMS Settings → Contact Page (for contact page display)
3. Update service times in both places
4. Save both

### Disable Contact Form Temporarily:
1. Go to CMS Settings → Contact Page
2. Uncheck "Enable Contact Form"
3. Save
4. Form hidden, contact info still visible

### Add New Announcement:
1. Go to Announcements
2. Click "Create Announcement"
3. Fill in details, upload image
4. Choose category, set pinned if important
5. Save
6. Appears on public Announcements page immediately

### Reply to Contact Message:
1. Go to Contact Messages
2. Click on unread message
3. Click "Reply" button
4. Type your response
5. Click "Send Reply"
6. Visitor receives email

---

## ✅ System Status

All critical features are working:
- ✅ Homepage CMS (full control)
- ✅ Footer CMS (controls all pages)
- ✅ Contact Page CMS (full control)
- ✅ About Page CMS (full control)
- ✅ Core Values CMS
- ✅ Contact Messages Management
- ✅ Members Management
- ✅ Announcements CRUD
- ✅ Activities/Events CRUD
- ✅ Gallery Management
- ✅ Hero Slider Management
- ✅ Leadership Management
- ✅ Social Media Links

---

## 🚀 Need Help?

Check these files in the repository:
- `CRITICAL_FIXES_APPLIED.md` - Detailed technical documentation
- `FIXES_APPLIED.md` - Previous fixes documentation
- `ADMIN_HOMEPAGE_COMPLETE.md` - Homepage CMS documentation
- `DEPLOYMENT_INSTRUCTIONS.md` - Deployment guide
- `BACKEND_API_UPDATES.md` - API documentation

---

**Platform is ready for use!** 🎉
