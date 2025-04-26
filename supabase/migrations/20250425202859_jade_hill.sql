/*
  # Fix RLS policies for order items and users tables

  1. Changes
    - Add policy for waiters to create order items
    - Add policy for users to create their own profile
    - Add policy for admins to create user profiles

  2. Security
    - Ensures waiters can only create order items for their own orders
    - Users can only create their own profile during signup
    - Admins maintain full control over user management
*/

-- Update order_items policies
CREATE POLICY "Waiters can create order items for their orders"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.waiter_id = auth.uid()
    )
  );

-- Update users policies
CREATE POLICY "Users can create their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow users to create their own profile during signup
    auth.uid() = id
    AND role IN ('waiter', 'barman', 'kitchen')
  );

CREATE POLICY "Admins can create user profiles"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow admins to create any user profile
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );