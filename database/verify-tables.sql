-- =============================================================
-- DATABASE VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify all tables exist
-- =============================================================

-- Count all tables
SELECT 
  'Total Tables' AS check_name,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) >= 28 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 28+ tables'
  END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- List all tables with row counts
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND columns.table_name = tables.table_name) AS column_count,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS size
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check core tables exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'churches') THEN '✅'
    ELSE '❌'
  END || ' churches' AS table_check
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN '✅' ELSE '❌' END || ' users'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN '✅' ELSE '❌' END || ' members'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN '✅' ELSE '❌' END || ' departments'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'choir_members') THEN '✅' ELSE '❌' END || ' choir_members'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'choir_broadcasts') THEN '✅' ELSE '❌' END || ' choir_broadcasts'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'choir_dues') THEN '✅' ELSE '❌' END || ' choir_dues'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN '✅' ELSE '❌' END || ' events'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_registrations') THEN '✅' ELSE '❌' END || ' event_registrations'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance') THEN '✅' ELSE '❌' END || ' attendance'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finance_categories') THEN '✅' ELSE '❌' END || ' finance_categories'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finance_transactions') THEN '✅' ELSE '❌' END || ' finance_transactions'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN '✅' ELSE '❌' END || ' notifications'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') THEN '✅' ELSE '❌' END || ' announcements'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gallery') THEN '✅' ELSE '❌' END || ' gallery'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sermons') THEN '✅' ELSE '❌' END || ' sermons'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'testimonials') THEN '✅' ELSE '❌' END || ' testimonials'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_requests') THEN '✅' ELSE '❌' END || ' prayer_requests'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_messages') THEN '✅' ELSE '❌' END || ' contact_messages'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leadership') THEN '✅' ELSE '❌' END || ' leadership'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN '✅' ELSE '❌' END || ' documents'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cms_pages') THEN '✅' ELSE '❌' END || ' cms_pages'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cms_hero_slides') THEN '✅' ELSE '❌' END || ' cms_hero_slides'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cms_settings') THEN '✅' ELSE '❌' END || ' cms_settings'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rehearsals') THEN '✅' ELSE '❌' END || ' rehearsals'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'music_library') THEN '✅' ELSE '❌' END || ' music_library'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auth_tokens') THEN '✅' ELSE '❌' END || ' auth_tokens'
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN '✅' ELSE '❌' END || ' audit_logs';

-- Check default church exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM churches WHERE id = '00000000-0000-0000-0000-000000000001') THEN '✅ Default church exists'
    ELSE '❌ Default church NOT found - Run schema.sql again'
  END AS church_check;

-- Check functions exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_member_code') THEN '✅'
    ELSE '❌'
  END || ' generate_member_code() function' AS function_check
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_receipt_number') THEN '✅'
    ELSE '❌'
  END || ' generate_receipt_number() function';

-- Check indexes
SELECT 
  'Total Indexes' AS check_name,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) >= 50 THEN '✅ PASS - Indexes created'
    ELSE '⚠️ WARNING - Some indexes may be missing'
  END AS status
FROM pg_indexes 
WHERE schemaname = 'public';

-- Summary
SELECT 
  '═══════════════════════════════════════' AS separator,
  'DATABASE VERIFICATION COMPLETE' AS summary;

-- If all checks show ✅, your database is ready!
-- If any show ❌, run the schema.sql file again.
