/*
  # Add settings table

  1. New Tables
    - `settings`
      - `id` (uuid, primary key)
      - `admin_email` (text)
      - `notifications` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `settings` table
    - Add policies for admin access
*/

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  notifications jsonb NOT NULL DEFAULT '{
    "logins": true,
    "transactions": true,
    "inventory": true
  }',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage settings"
ON settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Create trigger to update updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();