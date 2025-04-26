/*
  # Add business information to settings table

  1. Changes
    - Add business_info JSONB column to settings table
    - Set default business info values
    - Update existing rows with default values

  2. Security
    - Maintains existing RLS policies
*/

-- Add business_info column to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS business_info jsonb NOT NULL DEFAULT '{
  "name": "DECUBE Bar & Restaurant",
  "email": "contact@decube.com",
  "phone": "+1 (555) 123-4567",
  "address": "123 Restaurant Street"
}'::jsonb;

-- Update any existing rows with default business info
UPDATE settings
SET business_info = '{
  "name": "DECUBE Bar & Restaurant",
  "email": "contact@decube.com",
  "phone": "+1 (555) 123-4567",
  "address": "123 Restaurant Street"
}'::jsonb
WHERE business_info IS NULL;