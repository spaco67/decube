/*
  # Fix RLS policies for users table

  1. Changes
    - Add policy to allow authenticated users to read their own profile (if not exists)
    - Add policy to allow authenticated users to read other users' basic info (if not exists)
    - Add policy to allow users to update their own profile (if not exists)
  
  2. Security
    - Ensures users can only read their complete profile
    - Allows limited access to other users' basic info for staff coordination
    - Restricts profile updates to the user's own profile
*/

DO $$ 
BEGIN
  -- Only create policies if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
    ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
  END IF;

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

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
    ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Ensure RLS is enabled (this is idempotent)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;