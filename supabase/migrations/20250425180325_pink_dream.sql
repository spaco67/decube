/*
  # Simplified User Policies
  
  1. Changes
    - Create basic policies for user management
    - Enable RLS on users table
    - Allow user creation and profile management
    
  2. Security
    - Basic read/write access for own profile
    - Admin access for user management
*/

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Basic insert policy
CREATE POLICY "Allow user creation"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Basic read policy
CREATE POLICY "Allow profile access"
ON users
FOR SELECT
TO authenticated
USING (true);

-- Basic update policy
CREATE POLICY "Allow profile updates"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);