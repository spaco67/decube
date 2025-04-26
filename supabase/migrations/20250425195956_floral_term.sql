/*
  # Fix orders RLS policies for reporting

  1. Changes
    - Drop existing policies that may cause recursion
    - Create new, optimized policies for orders table
    - Add proper access control for different roles
    
  2. Security
    - Maintain same security level with more efficient policies
    - Ensure proper access for reporting functionality
    - Prevent infinite recursion in policy checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can update relevant orders" ON orders;
DROP POLICY IF EXISTS "Staff can view relevant orders" ON orders;
DROP POLICY IF EXISTS "Waiters can create orders" ON orders;

-- Create new, optimized policies
CREATE POLICY "admin_access_policy" ON orders
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "waiter_access_policy" ON orders
FOR ALL TO authenticated
USING (
  auth.uid() = waiter_id OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "kitchen_view_policy" ON orders
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'kitchen'
  )
);

CREATE POLICY "barman_view_policy" ON orders
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'barman'
  )
);

-- Add policy for reporting access
CREATE POLICY "reporting_access_policy" ON orders
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'waiter')
  )
);