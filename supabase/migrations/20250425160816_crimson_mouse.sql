/*
  # Fix admin authentication and role claims

  1. Changes
    - Add function to handle user role claims
    - Add function to update existing users
    - Update admin policies to use database role
  
  2. Security
    - Ensures admin role is properly set in auth.users
    - Updates RLS policies to use database role
*/

-- Create function to update user role in auth.users
CREATE OR REPLACE FUNCTION public.update_user_role(user_id uuid, user_role text)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || 
    json_build_object('role', user_role)::jsonb
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle new users and role updates
CREATE OR REPLACE FUNCTION public.handle_user_role()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_user_role(NEW.id::uuid, NEW.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update role
DROP TRIGGER IF EXISTS set_user_role ON public.users;
CREATE TRIGGER set_user_role
  AFTER INSERT OR UPDATE OF role
  ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_role();

-- Update existing admin policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can insert users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update users"
ON users
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can delete users"
ON users
FOR DELETE
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Update existing admin users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM users WHERE role = 'admin' LOOP
    PERFORM public.update_user_role(user_record.id::uuid, 'admin');
  END LOOP;
END;
$$ LANGUAGE plpgsql;