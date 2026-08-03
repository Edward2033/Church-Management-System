-- Clear demo/sample gallery data
-- Run this to remove placeholder images from the gallery

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

-- Optional: Clear ALL gallery data for a fresh start
-- Uncomment the line below if you want to clear everything
-- DELETE FROM gallery WHERE church_id = '00000000-0000-0000-0000-000000000001';
