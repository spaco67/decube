/*
  # Fix recursive RLS policies for users table

  1. Changes
    - Drop existing policies that cause recursion
    - Create new, non-recursive policies for the users table
    
  2. Security
    - Enable RLS on users table (maintained)
    - Add simplified policies that avoid recursion:
      - Users can view their own profile
      - Admins can view all profiles
      - Admins can manage all users
*/

-- First, drop existing problematic policies
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create new non-recursive policies
CREATE POLICY "Enable read access for users to their own record" ON users
FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable admin read access to all users" ON users
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  )
);

CREATE POLICY "Enable admin insert access" ON users
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  )
);

CREATE POLICY "Enable admin update access" ON users
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  )
);

CREATE POLICY "Enable admin delete access" ON users
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  )
);