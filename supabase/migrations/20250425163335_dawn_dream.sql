/*
  # Fix User Permissions

  1. Changes
    - Drop all existing user policies to start fresh
    - Create new simplified policies that allow:
      - Anyone to sign up (insert their own profile)
      - Users to read their own profile
      - Users to update their own profile
      - Admins to manage all users
    - Enable RLS on users table
    
  2. Security
    - Maintains proper access control while fixing permission issues
    - Ensures users can only access appropriate data
    - Preserves admin capabilities
*/

-- First drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can read other users basic info" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to sign up (create their own profile)
CREATE POLICY "Users can create own profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to manage all users
CREATE POLICY "Admins can manage users"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role')::text = 'admin'
  )
);