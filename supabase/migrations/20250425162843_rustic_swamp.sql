/*
  # Add user policies safely

  1. Changes
    - Add policy for user profile creation if it doesn't exist
    - Add policy for admin management if it doesn't exist
    - Add policy for basic user info access if it doesn't exist

  2. Security
    - Ensures users can only create their own profile
    - Maintains existing admin and read permissions
    - Preserves data integrity through ID matching
*/

DO $$ 
BEGIN
  -- Policy to allow users to create their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can create own profile'
  ) THEN
    CREATE POLICY "Users can create own profile"
      ON users
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;

  -- Policy to allow admins to manage all users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Admins can manage users'
  ) THEN
    CREATE POLICY "Admins can manage users"
      ON users
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
        )
      );
  END IF;

  -- Policy to allow basic user info to be read by all authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can read other users basic info'
  ) THEN
    CREATE POLICY "Users can read other users basic info"
      ON users
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;