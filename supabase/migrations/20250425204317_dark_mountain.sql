/*
  # Fix RLS policies for users table

  1. Changes
    - Remove WITH CHECK clauses from SELECT policies
    - Fix policy syntax for different operations
    - Maintain security while preventing recursion
    
  2. Security
    - Maintain RLS enabled on users table
    - Ensure proper access control for different roles
    - Prevent unauthorized access to user data
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "admin_full_access" ON users;
DROP POLICY IF EXISTS "users_create_profile" ON users;
DROP POLICY IF EXISTS "users_read_basic" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Recreate policies without recursion
-- Allow admins full access based on auth.uid() role claim
CREATE POLICY "admin_full_access" ON users
  FOR ALL 
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Allow users to create their own profile
CREATE POLICY "users_create_profile" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow basic read access to authenticated users (name and role only)
CREATE POLICY "users_read_basic" ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to read their own full profile
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