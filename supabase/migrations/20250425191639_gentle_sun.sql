/*
  # Create default settings row

  1. Changes
    - Insert default settings row if none exists
    - This ensures the settings table always has exactly one row
    - Default values:
      - admin_email: admin@decube.com
      - notifications: All enabled
      - business_info: Default DECUBE information
*/

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM settings) THEN
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