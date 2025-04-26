/*
  # Create menu items table and add initial data

  1. New Tables
    - `menu_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `category` (text: food, drink, dessert)
      - `price` (numeric)
      - `preparation_type` (text: kitchen, bar)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for admin management
    - Add policies for staff viewing

  3. Initial Data
    - Add sample menu items
*/

-- Create menu_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price numeric(10,2) NOT NULL,
  preparation_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT menu_items_category_check CHECK (category IN ('food', 'drink', 'dessert')),
  CONSTRAINT menu_items_preparation_type_check CHECK (preparation_type IN ('kitchen', 'bar'))
);

-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins can manage menu items" ON menu_items;
  DROP POLICY IF EXISTS "All staff can view menu items" ON menu_items;
END $$;

-- Create policies
CREATE POLICY "Admins can manage menu items"
ON menu_items
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "All staff can view menu items"
ON menu_items
FOR SELECT
TO authenticated
USING (true);

-- Insert initial menu items
INSERT INTO menu_items (name, category, price, preparation_type) VALUES
  -- Drinks (Bar items)
  ('Classic Mojito', 'drink', 9.99, 'bar'),
  ('Margarita', 'drink', 10.99, 'bar'),
  ('Old Fashioned', 'drink', 12.99, 'bar'),
  ('Red Wine (Glass)', 'drink', 8.99, 'bar'),
  ('White Wine (Glass)', 'drink', 8.99, 'bar'),
  ('Draft Beer', 'drink', 6.99, 'bar'),
  ('Bottled Beer', 'drink', 5.99, 'bar'),
  ('Espresso Martini', 'drink', 11.99, 'bar'),
  ('Soft Drink', 'drink', 3.99, 'bar'),
  ('Water', 'drink', 2.99, 'bar'),
  ('Maltina', 'drink', 3.99, 'bar'),
  
  -- Food (Kitchen items)
  ('Steak & Fries', 'food', 24.99, 'kitchen'),
  ('Grilled Salmon', 'food', 22.99, 'kitchen'),
  ('Burger & Fries', 'food', 16.99, 'kitchen'),
  ('Caesar Salad', 'food', 12.99, 'kitchen'),
  ('Pasta Carbonara', 'food', 18.99, 'kitchen'),
  ('Margherita Pizza', 'food', 15.99, 'kitchen'),
  ('Chicken Wings', 'food', 14.99, 'kitchen'),
  ('Nachos', 'food', 10.99, 'kitchen'),
  
  -- Desserts (Kitchen items)
  ('Chocolate Cake', 'dessert', 8.99, 'kitchen'),
  ('Cheesecake', 'dessert', 8.99, 'kitchen'),
  ('Ice Cream', 'dessert', 6.99, 'kitchen'),
  ('Tiramisu', 'dessert', 9.99, 'kitchen')
ON CONFLICT DO NOTHING;