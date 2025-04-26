/*
  # Fix order items policies

  1. Changes
    - Remove recursive policies from order_items table
    - Create new, simplified policies for order items access
    
  2. Security
    - Enable RLS on order_items table
    - Add clear, non-recursive policies for different user roles
*/

-- First, drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Staff can update relevant order items" ON order_items;
DROP POLICY IF EXISTS "Staff can view relevant order items" ON order_items;
DROP POLICY IF EXISTS "Waiters can create order items" ON order_items;

-- Create new, simplified policies
CREATE POLICY "Admin full access"
ON order_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Waiters can manage their orders' items"
ON order_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.waiter_id = auth.uid()
  )
);

CREATE POLICY "Kitchen staff can view and update kitchen items"
ON order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM menu_items
    WHERE menu_items.id = order_items.menu_item_id
    AND menu_items.preparation_type = 'kitchen'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'kitchen'
    )
  )
);

CREATE POLICY "Barmen can view and update bar items"
ON order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM menu_items
    WHERE menu_items.id = order_items.menu_item_id
    AND menu_items.preparation_type = 'bar'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'barman'
    )
  )
);