/*
  # Fix Orders RLS Policies

  1. Changes
    - Remove existing waiter insert policy that was causing issues
    - Add new, more specific policies for waiters to:
      - Create orders (with proper checks)
      - Update their own orders
      - Delete their own pending orders
    
  2. Security
    - Ensures waiters can only:
      - Create orders with themselves as waiter_id
      - Update/delete only their own orders
    - Maintains existing admin and view policies
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "waiter_insert_policy" ON orders;

-- Create new specific policies for waiters
CREATE POLICY "waiters_create_orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure the waiter can only create orders with their own ID
  (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'waiter'
    )
    AND
    waiter_id = auth.uid()
  )
);

CREATE POLICY "waiters_update_own_orders"
ON orders
FOR UPDATE
TO authenticated
USING (
  -- Can only update their own orders
  waiter_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'waiter'
  )
)
WITH CHECK (
  -- Ensure they can't change the waiter_id during updates
  waiter_id = auth.uid()
);

CREATE POLICY "waiters_delete_own_pending_orders"
ON orders
FOR DELETE
TO authenticated
USING (
  -- Can only delete their own orders that are still pending
  waiter_id = auth.uid()
  AND status = 'pending'
  AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'waiter'
  )
);