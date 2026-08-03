-- Add reply_message column to contact_messages table
-- This stores the admin's reply to the visitor

ALTER TABLE contact_messages 
ADD COLUMN IF NOT EXISTS reply_message TEXT;

-- Add index for faster queries on replied messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_replied 
ON contact_messages(is_replied, church_id, created_at DESC);

-- Add index for unread messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read 
ON contact_messages(is_read, church_id, created_at DESC);
