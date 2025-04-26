/*
  # Fix user table policies with existence checks

  1. Changes
    - Add IF NOT EXISTS to policy creation
    - Ensure policies are unique
    - Maintain same security rules but avoid duplicates

  2. Security
    - Enable RLS on users table
    - Allow basic profile management for authenticated users
    - Grant admin users full access via metadata
*/

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Create insert policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Enable insert for authentication service'
  ) THEN
    CREATE POLICY "Enable insert for authentication service"
    ON users
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;

  -- Create read policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Enable read access for users'
  ) THEN
    CREATE POLICY "Enable read access for users"
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
  END IF;

  -- Create update policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Enable update for users'
  ) THEN
    CREATE POLICY "Enable update for users"
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
  END IF;
END $$;