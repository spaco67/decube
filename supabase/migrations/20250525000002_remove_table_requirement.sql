/*
  # Remove Table Requirement
  
  1. Changes:
    - Alter orders table to make table_id optional
    - Update existing orders to handle null table_id
*/

-- Update foreign key constraint on orders table
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_table_id_fkey;

-- Add back the constraint but with ON DELETE SET NULL
ALTER TABLE orders
ADD CONSTRAINT orders_table_id_fkey
FOREIGN KEY (table_id)
REFERENCES tables(id)
ON DELETE SET NULL; 