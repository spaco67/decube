/*
  # Add Accountant Role and Receipts Table
  
  1. Changes:
    - Update users role check constraint to include 'accountant'
    - Create receipts table for receipt management
    - Add new functions and triggers for receipts
    - Set up policies for accountant access
    - Prepare for table feature removal
*/

-- Update the role check constraint for users table
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check CHECK (role IN ('waiter', 'barman', 'kitchen', 'admin', 'accountant'));

-- Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) NOT NULL,
  created_by uuid REFERENCES users(id),
  filename text,
  file_url text,
  shared_url text,
  shared_platform text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on the receipts table
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create policies for receipts
CREATE POLICY "Admins can manage receipts"
ON receipts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Accountants can manage receipts"
ON receipts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'accountant'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create receipt record when an order is completed
CREATE OR REPLACE FUNCTION create_receipt_on_order_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO receipts (order_id, created_by)
    VALUES (NEW.id, NEW.waiter_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic receipt creation
CREATE TRIGGER create_receipt_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_receipt_on_order_completion();

-- Prepare for table feature removal by making table_id optional in orders
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_table_id_fkey; 