/*
  # Add waiter insert policy for orders

  1. Changes
    - Add new RLS policy to allow waiters to create orders
    - Policy ensures waiters can only create orders with their own ID
    
  2. Security
    - Waiters can only create orders where they are assigned as the waiter
    - Maintains existing RLS policies for other operations
*/

-- Add policy for waiters to create orders
CREATE POLICY "waiter_insert_policy"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is the assigned waiter
  (auth.uid() = waiter_id)
  OR
  -- Or if user is an admin
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);