/*
  # Tables Management Schema Update

  1. Changes
    - Drop existing policies to avoid conflicts
    - Recreate tables table with proper constraints
    - Add updated policies for table management
    - Insert sample data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage tables" ON tables;
DROP POLICY IF EXISTS "All staff can view tables" ON tables;

-- Recreate tables table
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer NOT NULL UNIQUE,
  capacity integer NOT NULL,
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT tables_status_check CHECK (
    status IN ('available', 'occupied', 'reserved')
  )
);

-- Enable RLS
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Admins can manage tables"
ON tables
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "All staff can view tables"
ON tables
FOR SELECT
TO authenticated
USING (true);

-- Add sample tables
INSERT INTO tables (number, capacity, status)
VALUES
  (1, 4, 'available'),
  (2, 2, 'occupied'),
  (3, 6, 'reserved'),
  (4, 4, 'available'),
  (5, 8, 'available'),
  (6, 2, 'available')
ON CONFLICT DO NOTHING;