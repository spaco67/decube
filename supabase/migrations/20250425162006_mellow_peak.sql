/*
  # Fix User Roles and Policies

  1. Changes
    - Simplify user policies to avoid recursion
    - Add basic user profile policy
    - Update role handling
    - Add default admin user

  2. Security
    - Enable RLS
    - Add non-recursive policies
    - Ensure proper role-based access
*/

-- First drop existing policies
DROP POLICY IF EXISTS "Users can read their own full profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "All authenticated users can view basic user info" ON users;

-- Create simplified policies
CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

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

-- Create or update function to handle user roles
CREATE OR REPLACE FUNCTION handle_auth_user_role()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    json_build_object('role', NEW.role)::jsonb,
    raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    json_build_object('role', NEW.role)::jsonb
  WHERE id = NEW.id::uuid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS sync_user_role ON users;
CREATE TRIGGER sync_user_role
  AFTER INSERT OR UPDATE OF role
  ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_user_role();

-- Ensure admin user exists
INSERT INTO users (id, email, name, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  'Admin User',
  'admin'
)
ON CONFLICT (email) DO UPDATE
SET role = 'admin'
RETURNING id;