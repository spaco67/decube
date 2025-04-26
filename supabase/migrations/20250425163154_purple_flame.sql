/*
  # Simplified User Policies

  1. Changes
    - Drop all existing user policies
    - Create simplified policies for basic operations
    - Enable RLS on users table

  2. Security
    - Allow users to manage their own profile
    - Allow admins full access
    - Allow authenticated users to view basic info
*/

-- First drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can read other users basic info" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Enable read access for users to their own record" ON users;
DROP POLICY IF EXISTS "Enable admin read access to all users" ON users;
DROP POLICY IF EXISTS "Enable admin insert access" ON users;
DROP POLICY IF EXISTS "Enable admin update access" ON users;
DROP POLICY IF EXISTS "Enable admin delete access" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "Users can create own profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read other users basic info"
ON users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage users"
ON users
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1
  FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND (auth.users.raw_app_meta_data->>'role')::text = 'admin'
));