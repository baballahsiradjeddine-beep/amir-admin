-- Script to create a demo user in Supabase auth.users table for testing
-- Run this SQL in your Supabase SQL Editor

-- This UUID must match the DEMO_USER_ID in auth-context.tsx
-- UUID: 00000000-0000-0000-0000-000000000001

-- Note: Supabase manages auth.users through Auth API, not direct SQL
-- For testing purposes, we're using a demo UUID that should exist in the database

-- If you want to use Supabase Auth properly, follow these steps:
-- 1. Sign up for a new account on your Supabase project
-- 2. Get the user ID from the Auth section in Supabase dashboard
-- 3. Update DEMO_USER_ID in /app/context/auth-context.tsx with that ID
-- 4. Update auth credentials in the login function

-- For now, we'll insert a raw user entry (this is for demo/testing only)
-- In production, ALWAYS use Supabase Auth API

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change_token,
  phone_change,
  phone_change_sent_at,
  confirmed_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'thefoundersdz@gmail.com',
  crypt('amirnouadi26', gen_salt('bf')),
  now(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  now(),
  now(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Verify the user was created
SELECT id, email FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';
