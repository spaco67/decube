/*
  # Fix settings table to ensure single row

  1. Changes
    - Clean up any duplicate rows
    - Keep only the most recently updated row
    - Add trigger to enforce single row constraint
    - Create default settings if none exist

  2. Security
    - Maintains existing RLS policies
*/

-- First, keep only the most recently updated row and delete others
WITH latest_settings AS (
  SELECT id
  FROM settings
  ORDER BY updated_at DESC
  LIMIT 1
)
DELETE FROM settings
WHERE id NOT IN (SELECT id FROM latest_settings);

-- Create function to enforce single row
CREATE OR REPLACE FUNCTION enforce_single_settings_row()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM settings) > 0 THEN
    RAISE EXCEPTION 'Only one settings row is allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single row
DROP TRIGGER IF EXISTS ensure_single_settings_row ON settings;
CREATE TRIGGER ensure_single_settings_row
  BEFORE INSERT ON settings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_settings_row();

-- If no settings exist, create default row
INSERT INTO settings (admin_email, notifications, business_info)
SELECT 
  'admin@decube.com',
  '{
    "logins": true,
    "transactions": true,
    "inventory": true
  }'::jsonb,
  '{
    "name": "DECUBE Bar & Restaurant",
    "email": "contact@decube.com",
    "phone": "+1 (555) 123-4567",
    "address": "123 Restaurant Street"
  }'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM settings);