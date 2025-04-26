/*
  # Fix User Policies and Role Validation

  1. Changes
    - Drop all existing policies to avoid conflicts
    - Re-create policies with unique names
    - Add role validation constraint
*/

-- Drop all existing policies first
DROP POLICY IF EXISTS "Allow profile access" ON users;
DROP POLICY IF EXISTS "Enable insert for authentication service" ON users;
DROP POLICY IF EXISTS "Enable read access for users" ON users;
DROP POLICY IF EXISTS "Enable update for users" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Create new policies with unique names
CREATE POLICY "staff_profile_view_policy"
ON users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "staff_creation_policy"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "staff_read_policy"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role')::text = 'admin'
  )
);

CREATE POLICY "staff_update_policy"
ON users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role')::text = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id OR
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role')::text = 'admin'
  )
);

-- Add role validation
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('waiter', 'barman', 'kitchen', 'admin'));