# User Management & Registration System - Implementation Plan

## ✅ Features Already Implemented

### 1. Registration & Approval System
- ✅ Users can register with complete profile information
- ✅ Registration requires profile photo upload
- ✅ Admin approval workflow (pending → approved/rejected)
- ✅ Email sent on approval with secure password setup link
- ✅ Token-based password setup (expires after 24 hours)
- ✅ Role-based access control

### 2. User Roles Available
- ✅ Admin / Superadmin
- ✅ Pastor
- ✅ Elder
- ✅ Deacon
- ✅ Leader
- ✅ Choir Member / Choir Director
- ✅ Member
- ✅ Visitor

### 3. Profile Information Stored
- ✅ Full name (first, middle, last)
- ✅ Profile photo
- ✅ Date of birth
- ✅ Gender
- ✅ Phone & WhatsApp
- ✅ Email
- ✅ Address & City
- ✅ Emergency contact (name, phone, relation)
- ✅ Membership information
- ✅ Registration date
- ✅ Role assignment
- ✅ Choir information (voice group, experience, instruments)
- ✅ Baptism status & date
- ✅ Marital status
- ✅ Occupation
- ✅ Bio

### 4. Admin Capabilities
- ✅ View all members
- ✅ Approve/reject registrations
- ✅ View complete user profiles
- ✅ Edit user information
- ✅ Create sub-admins with custom permissions
- ✅ Deactivate accounts

---

## 🔨 Features To Implement

### 1. Manual User Creation by Admin
**Status:** Not implemented
**Location:** AdminMembers page
**Requirements:**
- Add "Create User" button on members page
- Form with all registration fields
- Profile photo upload
- Role selection (member, choir_member, pastor, etc.)
- Automatic approval (no pending state)
- Send welcome email with password setup link

### 2. Printable Registration Forms
**Status:** Not implemented
**Requirements:**
- Generate PDF-style printable view
- Include church logo
- Display user profile photo
- Show all registration details
- Generate unique QR code per user
- QR code links to user profile verification
- Signature areas (Pastor, Choir Director if applicable)
- Professional formatting

### 3. Enhanced Approval UI
**Status:** Partially implemented
**Improvements Needed:**
- Better pending registrations view
- One-click approve with email
- Bulk approval actions
- View complete registration before approval
- Rejection reason input

### 4. Choir Director Role Management
**Status:** Partially implemented
**Requirements:**
- Mark one user as "official" choir director
- Display choir director name on choir documents
- Choir director dashboard permissions
- Link choir director to choir management

---

## 📋 Implementation Steps

### Phase 1: Manual User Creation (Priority: HIGH)
**Files to Create/Modify:**
- `frontend/src/pages/admin/AdminMembers.tsx` - Add create user modal
- `backend/src/routes/members.js` - Add POST /members/create endpoint

**Backend Endpoint:**
```javascript
POST /api/members/create
Body: {
  firstName, lastName, email, phone, gender, dateOfBirth,
  address, role, profilePhoto (file), voiceGroup (if choir)
}
Response: { member, message: "User created, setup email sent" }
```

### Phase 2: Printable Registration Forms (Priority: HIGH)
**Files to Create:**
- `frontend/src/components/PrintableRegistrationForm.tsx`
- `frontend/src/pages/admin/MemberPrintView.tsx`
- Install: `qrcode.react` for QR code generation

**Features:**
- Print-optimized CSS (`@media print`)
- Church logo display
- QR code generation (unique URL per user)
- Signature lines with conditional display
- Professional document layout

### Phase 3: Enhanced Approval System (Priority: MEDIUM)
**Files to Modify:**
- `frontend/src/pages/admin/AdminMembers.tsx`
- Add pending registrations section at top
- Cards with complete preview
- Quick approve/reject buttons
- Rejection reason modal

### Phase 4: Choir Director Management (Priority: MEDIUM)
**Database Update:**
```sql
ALTER TABLE choir_members ADD COLUMN is_director BOOLEAN DEFAULT FALSE;
CREATE UNIQUE INDEX idx_one_choir_director_per_church 
  ON choir_members (church_id) 
  WHERE is_director = TRUE;
```

**Backend:**
- Update choir routes to handle director flag
- API to set/unset director

**Frontend:**
- Badge showing "Choir Director"
- Director info on choir pages

---

## 🔐 Security Considerations

### QR Code Security
- QR code URL format: `https://domain.com/verify/{encrypted_member_id}`
- Use JWT token or encrypted ID (not plain member ID)
- Public verification page shows limited info only
- No sensitive data exposed

### Password Setup Links
- ✅ Already secure (token-based, 24-hour expiry)
- ✅ One-time use only
- ✅ Tokens stored in auth_tokens table

### Role-Based Access
- ✅ Middleware checks role on protected routes
- ✅ Admin-only actions protected
- Choir director gets limited admin access

---

## 📧 Email Templates

### Approval Email (Already Exists)
```
Subject: Account Approved - LUS4G Church

Hello [First Name],

Your registration has been approved! Welcome to LUS4G Church.

Set your password to access your dashboard:
[Secure Link]

This link expires in 24 hours.

Best regards,
LUS4G Church Team
```

### Manual Creation Email (New)
```
Subject: Welcome to LUS4G Church - Account Created

Hello [First Name],

An account has been created for you at LUS4G Church.

Role: [Role Name]
Email: [Email]

Set your password to access your dashboard:
[Secure Link]

This link expires in 24 hours.

Best regards,
LUS4G Church Team
```

---

## 🎨 UI Components Needed

### 1. Create User Modal
- Multi-step form
- Profile photo upload preview
- Role selector with descriptions
- Choir-specific fields (conditional)
- Submit button → creates user + sends email

### 2. Printable Form Component
- A4 page size layout
- Header with logo
- User photo (circular, top-right)
- Information grid layout
- QR code (bottom-right)
- Signature areas (bottom)
- Print button (hidden in print view)

### 3. Pending Registrations Dashboard
- Card grid layout
- User photo + key info
- Approve/Reject buttons
- "View Details" modal
- Bulk selection checkboxes

---

## 📦 Dependencies to Install

### Frontend
```bash
npm install qrcode.react @types/qrcode.react
npm install react-to-print
```

### Backend
- ✅ All dependencies already installed

---

## 🧪 Testing Checklist

- [ ] Admin can create member manually
- [ ] Admin can create choir member manually
- [ ] Created users receive email
- [ ] Password setup link works for manually created users
- [ ] Print view displays correctly
- [ ] QR code generates and scans correctly
- [ ] QR code verification page works
- [ ] Signature areas show conditionally
- [ ] Church logo displays
- [ ] Pastor signature area shows for all
- [ ] Choir director signature shows for choir only
- [ ] Print layout is professional (A4 size)
- [ ] Existing features still work
- [ ] Registration approval flow unchanged
- [ ] Choir director can be designated
- [ ] Only one choir director per church

---

## 📁 File Structure

```
backend/src/routes/
├── members.js (add create endpoint)
├── choir.js (add director management)
└── verify.js (NEW - QR verification)

frontend/src/
├── components/
│   ├── PrintableRegistrationForm.tsx (NEW)
│   └── QRCodeGenerator.tsx (NEW)
├── pages/
│   └── admin/
│       ├── AdminMembers.tsx (enhance)
│       ├── MemberPrintView.tsx (NEW)
│       └── CreateUserModal.tsx (NEW)
└── pages/
    └── VerifyMember.tsx (NEW - public QR verification)
```

---

## 🚀 Deployment Notes

1. Run database migration for choir director flag
2. Upload church logo to Cloudinary
3. Set CHURCH_LOGO_URL in environment variables
4. Deploy backend with new routes
5. Deploy frontend with new pages
6. Test QR code verification URL
7. Test email delivery

---

## Current Database Schema Support

✅ All required fields already exist in schema:
- members table has all profile fields
- choir_members table for choir info
- auth_tokens for password setup
- users table for authentication
- permissions system for role-based access

Only addition needed:
- `is_director` flag on choir_members table

---

This document will guide the implementation of the complete user management system.
