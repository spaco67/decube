/*
  # Add payment fields to orders table
  
  1. Changes
    - Add payment_method column to orders table
    - Add payment_status column to orders table
    - Add payment_amount column to orders table
    - Add payment_reference column to orders table
    
  2. Constraints
    - payment_method can only be 'cash', 'card', or 'transfer'
    - payment_status can only be 'pending', 'paid', or 'failed'
    - payment_amount must be >= 0
*/

-- Add payment-related columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_amount numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_reference text;

-- Add constraints
ALTER TABLE orders
ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IN ('cash', 'card', 'transfer')),
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed')),
ADD CONSTRAINT orders_payment_amount_check 
CHECK (payment_amount >= 0);