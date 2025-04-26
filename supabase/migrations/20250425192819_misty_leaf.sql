/*
  # Fix settings table default row

  1. Changes
    - Ensures a default settings row exists
    - Updates the settings table to maintain a single row

  2. Default Values
    - Sets default admin email and business info
    - Maintains existing notifications structure
*/

-- First, check if any settings exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM settings LIMIT 1) THEN
    INSERT INTO settings (
      admin_email,
      notifications,
      business_info
    ) VALUES (
      'admin@decube.com',
      '{
        "logins": true,
        "inventory": true,
        "transactions": true
      }'::jsonb,
      '{
        "name": "DECUBE Bar & Restaurant",
        "email": "contact@decube.com",
        "phone": "+1 (555) 123-4567",
        "address": "123 Restaurant Street"
      }'::jsonb
    );
  END IF;
END $$;