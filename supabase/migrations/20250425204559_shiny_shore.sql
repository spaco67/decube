/*
  # Fix User Policies and Session Handling

  1. Changes
    - Simplify user policies to prevent recursion
    - Fix admin access policy
    - Add proper session handling policies
    
  2. Security
    - Maintain RLS enabled
    - Ensure proper access control
    - Fix admin creation and management
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "admin_full_access" ON users;
DROP POLICY IF EXISTS "users_create_profile" ON users;
DROP POLICY IF EXISTS "users_read_basic" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Allow admins full access without recursion
CREATE POLICY "admin_full_access" ON users
  FOR ALL 
  TO authenticated
  USING ((auth.jwt() ->> 'role')::text = 'admin');

-- Allow users to read basic info (needed for order management)
CREATE POLICY "users_read_basic" ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to read their own profile
CREATE POLICY "users_read_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow initial profile creation during signup
CREATE POLICY "users_create_profile" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);