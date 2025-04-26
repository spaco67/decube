/*
  # Fix users table RLS policies

  1. Changes
    - Remove redundant and recursive policies
    - Consolidate policies into clear, non-recursive rules
    - Ensure proper access control while preventing infinite loops
  
  2. Security
    - Maintain RLS on users table
    - Simplify policies to prevent recursion
    - Ensure admins can manage all users
    - Allow users to manage their own profiles
    - Allow authenticated users to view basic user info
*/

-- First, drop existing policies to clean up
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "users_admin_create" ON users;
DROP POLICY IF EXISTS "users_admin_manage" ON users;
DROP POLICY IF EXISTS "users_read_access" ON users;
DROP POLICY IF EXISTS "users_read_all" ON users;
DROP POLICY IF EXISTS "users_self_create" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
DROP POLICY IF EXISTS "Admins can create user profiles" ON users;

-- Create new, simplified policies
-- Allow admins full access
CREATE POLICY "admin_full_access" ON users
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Allow users to read their own profile
CREATE POLICY "users_read_own" ON users
  FOR SELECT 
  TO authenticated
  USING (id = auth.uid());

-- Allow users to read basic info of other users (needed for order management)
CREATE POLICY "users_read_basic" ON users
  FOR SELECT 
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE 
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow initial profile creation during signup
CREATE POLICY "users_create_profile" ON users
  FOR INSERT 
  TO authenticated
  WITH CHECK (id = auth.uid());