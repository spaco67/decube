/*
  # Create notifications table and related functions

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `title` (text)
      - `message` (text)
      - `type` (text: info, success, warning, error)
      - `read` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `notifications` table
    - Add policies for authenticated users
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update notification read status"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();