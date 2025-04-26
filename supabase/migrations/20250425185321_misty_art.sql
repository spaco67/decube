/*
  # Fix users table RLS policies

  1. Changes
    - Remove redundant and recursive policies from users table
    - Create clear, non-recursive policies for:
      - Admins: Full access to all users
      - Users: Can read all users but only update their own profile
      
  2. Security
    - Maintains RLS on users table
    - Simplifies policy structure to prevent recursion
    - Ensures proper access control without circular dependencies
*/

-- Drop existing policies to clean up
DROP POLICY IF EXISTS "Allow profile updates" ON users;
DROP POLICY IF EXISTS "Allow user creation" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;
DROP POLICY IF EXISTS "staff_creation_policy" ON users;
DROP POLICY IF EXISTS "staff_profile_view_policy" ON users;
DROP POLICY IF EXISTS "staff_read_policy" ON users;
DROP POLICY IF EXISTS "staff_update_policy" ON users;

-- Create new, simplified policies
-- Allow admins full access
CREATE POLICY "admin_full_access" ON users
FOR ALL TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);

-- Allow all authenticated users to read all users
CREATE POLICY "users_read_access" ON users
FOR SELECT TO authenticated
USING (true);

-- Allow users to update their own profile
CREATE POLICY "users_update_own_profile" ON users
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);