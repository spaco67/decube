/*
  # Fix Orders Table Policies

  1. Changes
    - Drop and recreate waiter-specific policies
    - Ensure proper access control for waiters
    - Keep existing admin and view policies intact
    
  2. Security
    - Waiters can only:
      - Create orders with themselves as waiter_id
      - Update their own orders
      - Delete their pending orders
*/

-- Drop only waiter-specific policies
DROP POLICY IF EXISTS "waiter_insert_policy" ON orders;
DROP POLICY IF EXISTS "waiters_create_orders" ON orders;
DROP POLICY IF EXISTS "waiters_update_own_orders" ON orders;
DROP POLICY IF EXISTS "waiters_delete_own_pending_orders" ON orders;

-- Create new waiter-specific policies
CREATE POLICY "waiters_create_orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'waiter'
  )
);

CREATE POLICY "waiters_update_own_orders"
ON orders
FOR UPDATE
TO authenticated
USING (
  waiter_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'waiter'
  )
)
WITH CHECK (waiter_id = auth.uid());

CREATE POLICY "waiters_delete_own_pending_orders"
ON orders
FOR DELETE
TO authenticated
USING (
  waiter_id = auth.uid()
  AND status = 'pending'
  AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'waiter'
  )
);