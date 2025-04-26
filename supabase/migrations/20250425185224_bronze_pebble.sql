/*
  # Add user deletion trigger

  1. Changes
    - Add a trigger to automatically delete auth.users when a user is deleted from the users table
    
  2. Security
    - Only admins can delete users through RLS policies
    - Trigger ensures auth user is also deleted when profile is removed
*/

-- Create the function to delete auth user
CREATE OR REPLACE FUNCTION delete_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the auth.users record
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_user_deleted
  AFTER DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION delete_auth_user();

-- Update RLS policy to ensure only admins can delete users
CREATE POLICY "Only admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );