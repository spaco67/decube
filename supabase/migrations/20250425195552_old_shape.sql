/*
  # Fix order_items RLS policies

  1. Changes
    - Drop existing policies that cause infinite recursion
    - Create new, optimized policies for order_items table
    
  2. Security
    - Maintain same security level but with more efficient policies
    - Ensure proper access control for all user roles
    - Prevent infinite recursion in policy checks
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admin full access" ON order_items;
DROP POLICY IF EXISTS "Barmen can view and update bar items" ON order_items;
DROP POLICY IF EXISTS "Kitchen staff can view and update kitchen items" ON order_items;
DROP POLICY IF EXISTS "Waiters can manage their orders' items" ON order_items;

-- Create new, optimized policies
-- Admin policy
CREATE POLICY "Admin full access" ON order_items
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Barman policy
CREATE POLICY "Barmen can view bar items" ON order_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'barman'
  )
  AND
  EXISTS (
    SELECT 1 FROM menu_items
    WHERE menu_items.id = order_items.menu_item_id
    AND menu_items.preparation_type = 'bar'
  )
);

-- Kitchen staff policy
CREATE POLICY "Kitchen staff can view kitchen items" ON order_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'kitchen'
  )
  AND
  EXISTS (
    SELECT 1 FROM menu_items
    WHERE menu_items.id = order_items.menu_item_id
    AND menu_items.preparation_type = 'kitchen'
  )
);

-- Waiter policy
CREATE POLICY "Waiters can manage their orders items" ON order_items
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.waiter_id = auth.uid()
  )
);