/*
  # Fix order items RLS policies

  1. Changes
    - Add policy for waiters to create order items
    - Fix policy for waiters to manage their orders' items

  2. Security
    - Enable RLS on order_items table
    - Add policies for waiters to create and manage order items
    - Maintain existing policies for other roles
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Waiters can create order items for their orders" ON order_items;
DROP POLICY IF EXISTS "waiter_access_policy" ON order_items;

-- Create new policies for waiters
CREATE POLICY "waiters_create_order_items"
ON order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
    AND o.waiter_id = auth.uid()
    AND o.status = 'pending'
  )
);

CREATE POLICY "waiters_manage_order_items"
ON order_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
    AND o.waiter_id = auth.uid()
  )
);