-- =============================================================
-- FRESH DEPLOYMENT SCRIPT
-- Run this in Supabase SQL Editor for a clean deployment
-- =============================================================

-- Drop all existing tables (if any) in correct order
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS auth_tokens CASCADE;
DROP TABLE IF EXISTS choir_broadcasts CASCADE;
DROP TABLE IF EXISTS choir_dues CASCADE;
DROP TABLE IF EXISTS rehearsals CASCADE;
DROP TABLE IF EXISTS music_library CASCADE;
DROP TABLE IF EXISTS choir_members CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS finance_transactions CASCADE;
DROP TABLE IF EXISTS finance_categories CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS prayer_requests CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS sermons CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS gallery CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS leadership CASCADE;
DROP TABLE IF EXISTS cms_hero_slides CASCADE;
DROP TABLE IF EXISTS cms_pages CASCADE;
DROP TABLE IF EXISTS cms_settings CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS churches CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS generate_member_code CASCADE;
DROP FUNCTION IF EXISTS generate_receipt_number CASCADE;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- NOW RUN THE MAIN SCHEMA
-- After running this script, go back and run schema.sql
-- =============================================================

SELECT 'Database cleaned. Now run schema.sql to create all tables.' AS status;
