/*
  # Create Admin User

  1. Changes
    - Creates the first admin user in public.users table
    - Sets up admin profile with proper role
    - Email: admin@decube.com

  2. Security
    - Uses UUID for user identification
    - Ensures email uniqueness
*/

INSERT INTO public.users (
  id,
  email,
  name,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@decube.com',
  'Admin User',
  'admin',
  now(),
  now()
)
ON CONFLICT (email) DO NOTHING;