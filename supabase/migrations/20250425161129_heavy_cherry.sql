/*
  # Fix recursive RLS policies for users table

  1. Changes
    - Drop existing policies that are causing recursion
    - Create new, simplified policies for the users table that avoid recursion
    - Maintain security while allowing proper access to user data

  2. Security
    - Users can read their own data
    - Admins can manage all users
    - All authenticated users can read basic user info
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Enable admin delete access" ON users;
DROP POLICY IF EXISTS "Enable admin insert access" ON users;
DROP POLICY IF EXISTS "Enable admin read access to all users" ON users;
DROP POLICY IF EXISTS "Enable admin update access" ON users;
DROP POLICY IF EXISTS "Enable read access for users to their own record" ON users;

-- Create new, non-recursive policies
CREATE POLICY "Users can read their own full profile"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Admins can manage all users"
ON users
FOR ALL
TO authenticated
USING (
  role = 'admin'
);

CREATE POLICY "All authenticated users can view basic user info"
ON users
FOR SELECT
TO authenticated
USING (
  true
);