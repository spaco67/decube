/*
  # Initial Schema Setup for DECUBE Restaurant Management System

  1. New Tables
    - `users`
      - Authentication and user management
      - Stores staff information with role-based access
    
    - `tables`
      - Restaurant table management
      - Tracks table status and capacity
    
    - `menu_items`
      - Restaurant menu items
      - Includes food, drinks, and desserts
    
    - `orders`
      - Customer orders
      - Links to tables and staff
    
    - `order_items`
      - Individual items in orders
      - Links to menu items and tracks preparation status

  2. Security
    - Enable RLS on all tables
    - Set up policies for role-based access
    - Ensure data isolation between staff roles
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('waiter', 'barman', 'kitchen', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tables table
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer UNIQUE NOT NULL,
  capacity integer NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('food', 'drink', 'dessert')),
  price decimal(10,2) NOT NULL,
  preparation_type text NOT NULL CHECK (preparation_type IN ('kitchen', 'bar')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES tables(id),
  waiter_id uuid REFERENCES users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'ready', 'completed', 'cancelled')),
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  menu_item_id uuid REFERENCES menu_items(id),
  quantity integer NOT NULL DEFAULT 1,
  price decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'ready', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
  ON users
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Create policies for tables table
CREATE POLICY "All staff can view tables"
  ON tables
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage tables"
  ON tables
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Create policies for menu_items table
CREATE POLICY "All staff can view menu items"
  ON menu_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage menu items"
  ON menu_items
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Create policies for orders table
CREATE POLICY "Staff can view relevant orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND (
        role = 'admin' OR
        id = waiter_id OR
        (role = 'barman' AND EXISTS (
          SELECT 1 FROM order_items oi
          JOIN menu_items mi ON oi.menu_item_id = mi.id
          WHERE oi.order_id = orders.id AND mi.preparation_type = 'bar'
        )) OR
        (role = 'kitchen' AND EXISTS (
          SELECT 1 FROM order_items oi
          JOIN menu_items mi ON oi.menu_item_id = mi.id
          WHERE oi.order_id = orders.id AND mi.preparation_type = 'kitchen'
        ))
      )
    )
  );

CREATE POLICY "Waiters can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND (role = 'waiter' OR role = 'admin')
    )
  );

CREATE POLICY "Staff can update relevant orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND (
        role = 'admin' OR
        id = waiter_id OR
        (role = 'barman' AND EXISTS (
          SELECT 1 FROM order_items oi
          JOIN menu_items mi ON oi.menu_item_id = mi.id
          WHERE oi.order_id = orders.id AND mi.preparation_type = 'bar'
        )) OR
        (role = 'kitchen' AND EXISTS (
          SELECT 1 FROM order_items oi
          JOIN menu_items mi ON oi.menu_item_id = mi.id
          WHERE oi.order_id = orders.id AND mi.preparation_type = 'kitchen'
        ))
      )
    )
  );

-- Create policies for order_items table
CREATE POLICY "Staff can view relevant order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN users u ON u.id = auth.uid()
      WHERE o.id = order_items.order_id AND (
        u.role = 'admin' OR
        u.id = o.waiter_id OR
        (u.role = 'barman' AND EXISTS (
          SELECT 1 FROM menu_items mi
          WHERE mi.id = order_items.menu_item_id AND mi.preparation_type = 'bar'
        )) OR
        (u.role = 'kitchen' AND EXISTS (
          SELECT 1 FROM menu_items mi
          WHERE mi.id = order_items.menu_item_id AND mi.preparation_type = 'kitchen'
        ))
      )
    )
  );

CREATE POLICY "Waiters can create order items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN orders o ON o.id = order_items.order_id
      WHERE u.id = auth.uid() AND (u.role = 'waiter' OR u.role = 'admin')
    )
  );

CREATE POLICY "Staff can update relevant order items"
  ON order_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN orders o ON o.id = order_items.order_id
      WHERE u.id = auth.uid() AND (
        u.role = 'admin' OR
        u.id = o.waiter_id OR
        (u.role = 'barman' AND EXISTS (
          SELECT 1 FROM menu_items mi
          WHERE mi.id = order_items.menu_item_id AND mi.preparation_type = 'bar'
        )) OR
        (u.role = 'kitchen' AND EXISTS (
          SELECT 1 FROM menu_items mi
          WHERE mi.id = order_items.menu_item_id AND mi.preparation_type = 'kitchen'
        ))
      )
    )
  );