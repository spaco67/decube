/*
  # Add Management Tables

  1. New Tables
    - `inventory_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `category` (text)
      - `quantity` (numeric)
      - `unit` (text)
      - `min_stock` (numeric)
      - `price` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
    - Add policies for staff viewing

  3. Changes
    - Add inventory management functionality
    - Add stock tracking
    - Add price management
*/

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL,
  min_stock numeric NOT NULL DEFAULT 0,
  price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT inventory_items_category_check CHECK (
    category IN ('beverages', 'meat', 'dry-goods', 'vegetables', 'dairy', 'spices')
  ),
  CONSTRAINT inventory_items_unit_check CHECK (
    unit IN ('units', 'kg', 'g', 'l', 'ml', 'bottles', 'boxes')
  )
);

-- Enable RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory_items
CREATE POLICY "Admins can manage inventory"
ON inventory_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Staff can view inventory"
ON inventory_items
FOR SELECT
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamps
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add sample inventory items
INSERT INTO inventory_items (name, category, quantity, unit, min_stock, price)
VALUES
  ('Red Wine', 'beverages', 48, 'bottles', 20, 3500.00),
  ('Chicken Breast', 'meat', 15, 'kg', 20, 2500.00),
  ('Pasta', 'dry-goods', 50, 'kg', 30, 800.00),
  ('Tomatoes', 'vegetables', 8, 'kg', 10, 500.00),
  ('Milk', 'dairy', 20, 'l', 15, 900.00),
  ('Black Pepper', 'spices', 5, 'kg', 2, 1500.00)
ON CONFLICT DO NOTHING;