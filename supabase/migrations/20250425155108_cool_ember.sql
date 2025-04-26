/*
  # Fix recursive RLS policies for users table

  1. Changes
    - Drop existing policies that cause recursion
    - Create new non-recursive policies for user management
  
  2. Security
    - Maintain same level of access control but without recursion
    - Users can still only view their own profile
    - Admins can still manage all users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Create new non-recursive policies
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins can insert users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins can update users"
ON users
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins can delete users"
ON users
FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);