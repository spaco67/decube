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

-- Drop existing policies
DROP POLICY IF EXISTS "Admin full access" ON order_items;
DROP POLICY IF EXISTS "Barmen can view bar items" ON order_items;
DROP POLICY IF EXISTS "Kitchen staff can view kitchen items" ON order_items;
DROP POLICY IF EXISTS "Waiters can manage their orders items" ON order_items;

-- Create new, optimized policies
CREATE POLICY "admin_access_policy" ON order_items
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "barman_access_policy" ON order_items
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    CROSS JOIN menu_items m
    WHERE u.id = auth.uid()
    AND u.role = 'barman'
    AND m.id = order_items.menu_item_id
    AND m.preparation_type = 'bar'
  )
);

CREATE POLICY "kitchen_access_policy" ON order_items
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    CROSS JOIN menu_items m
    WHERE u.id = auth.uid()
    AND u.role = 'kitchen'
    AND m.id = order_items.menu_item_id
    AND m.preparation_type = 'kitchen'
  )
);

CREATE POLICY "waiter_access_policy" ON order_items
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
    AND o.waiter_id = auth.uid()
  )
);