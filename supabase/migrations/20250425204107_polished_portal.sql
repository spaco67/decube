/*
  # Fix RLS policies for orders and users

  1. Changes
    - Drop existing policies to avoid conflicts
    - Add comprehensive RLS policies with unique names
    - Ensure proper access control for all roles
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "admin_access_policy" ON orders;
DROP POLICY IF EXISTS "admin_access_policy" ON order_items;
DROP POLICY IF EXISTS "admin_full_access" ON users;

-- Orders table policies
CREATE POLICY "orders_admin_full_access"
ON orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "orders_waiter_access"
ON orders
FOR ALL
TO authenticated
USING (
  (auth.uid() = waiter_id) OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "orders_waiter_create"
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

-- Order items table policies
CREATE POLICY "order_items_admin_access"
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

CREATE POLICY "order_items_waiter_create"
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

CREATE POLICY "order_items_waiter_manage"
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

-- Users table policies
CREATE POLICY "users_read_all"
ON users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "users_update_own"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_admin_manage"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "users_self_create"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id AND
  role IN ('waiter', 'barman', 'kitchen')
);

CREATE POLICY "users_admin_create"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Settings table policies
CREATE POLICY "settings_admin_manage"
ON settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "settings_staff_read"
ON settings
FOR SELECT
TO authenticated
USING (true);