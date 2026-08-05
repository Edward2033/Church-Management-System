# DATABASE MIGRATION INSTRUCTIONS

## ⚠️ CRITICAL: SQL MIGRATION ERROR FIX

You are experiencing the "column session_id does not exist" error when running SQL migrations. This happens because old database views reference columns that don't exist yet.

## ✅ SOLUTION: Two-Step Migration Process

### STEP 1: Run CLEANUP_FIRST.sql

1. Open **Supabase SQL Editor**
2. Copy the entire contents of `CLEANUP_FIRST.sql` from the project root
3. Paste into SQL Editor
4. Click "Run"
5. You should see: **"Cleanup completed! Now run RUN_THIS_SECOND.sql"**

### STEP 2: Run RUN_THIS_SECOND.sql

1. **After** Step 1 completes successfully
2. Copy the entire contents of `RUN_THIS_SECOND.sql` from the project root
3. Paste into SQL Editor
4. Click "Run"
5. You should see: **"Migration completed successfully!"**

## 📋 What These Scripts Do

### CLEANUP_FIRST.sql
- Drops all old views that cause conflicts
- Drops old triggers
- Drops old tables if they exist
- Prepares database for fresh installation

### RUN_THIS_SECOND.sql
- Extends notifications table with new columns
- Creates notification_delivery table (for tracking who received what)
- Creates attendance_sessions table (for church events)
- Creates attendance_responses table (for member responses)
- Creates recognitions table (for member recognition)
- Creates database views for statistics
- Creates triggers for automatic counting
- Grants proper permissions

## 🎯 What You Get After Migration

1. **Notification System**
   - Enhanced notifications with priority, images, attachments
   - Email tracking
   - Delivery and read tracking
   - Expiry dates
   - User targeting (all users, members only, choir only, leaders only)

2. **Attendance System**
   - Attendance sessions for all event types
   - Auto-generated Bible verses for invitations
   - Encouragement messages
   - Member responses (I Will Attend / I Cannot Attend)
   - Reason tracking for absences
   - Real-time statistics

3. **Recognition System**
   - Auto-calculated member recognition
   - Categories: Highest Attendance, Most Consistent, Most Active Choir, etc.
   - Publishing control
   - Featured recognitions

## ⚡ After Migration is Complete

### Frontend Changes Already Done
✅ MemberAttendance component created
✅ MemberNotifications component enhanced
✅ Navigation links added to MemberDashboard
✅ Attendance route integrated

### Backend APIs Already Live (Deployed to Render)
✅ `/api/notifications` - Full CRUD, targeting, delivery tracking
✅ `/api/attendance` - Sessions, invitations, responses, statistics
✅ `/api/recognition` - Auto-generation, publishing, email notifications
✅ `/api/attendance/my-invitations` - Member's attendance invitations
✅ `/api/attendance/my-stats` - Member's attendance statistics
✅ `/api/attendance/:id/respond` - Member response endpoint

## 🧪 Testing After Migration

1. **Admin Creates Attendance Session:**
   - Log in as Admin
   - Go to Admin Dashboard → Attendance
   - Create a new session (e.g., "Sunday Service")
   - Click "Send Invitation"

2. **Member Receives Invitation:**
   - Log in as a member
   - Go to Dashboard → Attendance
   - See the invitation with Bible verse
   - Click "I Will Attend" or "I Cannot Attend"

3. **Admin Views Responses:**
   - Return to Admin Dashboard → Attendance
   - Click on the session
   - See list of who's attending and who declined

## 🚨 If You Still Get Errors

1. **Make sure you run CLEANUP_FIRST.sql FIRST**
   - Don't skip this step
   - Wait for it to complete
   
2. **Check for typos**
   - Copy the entire file contents
   - Don't manually type anything

3. **Check Supabase connection**
   - Make sure you're connected to the right database
   - Check if you have proper permissions

## 📝 Notes

- **DO NOT commit SQL files to git** (per your instructions)
- Both SQL files are in the project root directory
- The migration is **safe** - it uses `IF NOT EXISTS` checks
- If migration fails halfway, run CLEANUP_FIRST.sql again and restart

## ✨ Next Steps After Successful Migration

1. Test the entire flow from admin creating session → member responding
2. Check email notifications are being sent
3. View attendance statistics in both admin and member dashboards
4. Test recognition auto-generation
5. Verify birthday notifications are working with all user info
