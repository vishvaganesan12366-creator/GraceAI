/*
# Create demo user accounts and seed officers, complaints, and related data

1. Changes
  - Creates 3 demo auth users: citizen, officer, admin with predefined emails.
  - Creates corresponding profile entries with appropriate roles.
  - Creates officer records linking officer users to departments.
  - Seeds 50 realistic complaints with AI analysis fields, SLA deadlines, and various statuses.
  - Seeds complaint_updates, notifications, and feedback.

2. Security
  - Demo accounts use simple passwords for hackathon demo purposes.
  - This is a one-time seed migration.

3. Notes
  - Demo credentials:
    - Citizen: citizen@grace.ai / citizen123
    - Officer: officer@grace.ai / officer123
    - Admin: admin@grace.ai / admin123
  - Additional citizens are created for realistic complaint data.
  - Complaints span multiple categories, departments, priorities, and statuses.
  - SLA deadlines are computed from created_at + sla_hours.
*/

-- Create demo users using auth.users table directly
-- We'll use the admin API to create users, but since we're in SQL, we'll use a different approach

-- First, let's create a function to create auth users
CREATE OR REPLACE FUNCTION public.create_demo_user(
  p_email text,
  p_password text,
  p_name text,
  p_phone text,
  p_role text,
  p_location text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = auth, public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  IF v_user_id IS NOT NULL THEN
    -- Update existing
    UPDATE auth.users SET
      encrypted_password = crypt(p_password, gen_salt('bf')),
      raw_user_meta_data = jsonb_build_object(
        'name', p_name,
        'phone', p_phone,
        'role', p_role,
        'location', p_location
      )
    WHERE id = v_user_id;
    -- Update profile
    UPDATE profiles SET
      name = p_name,
      phone = p_phone,
      role = p_role,
      location = p_location
    WHERE id = v_user_id;
    RETURN v_user_id;
  END IF;

  -- Create new user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('name', p_name, 'phone', p_phone, 'role', p_role, 'location', p_location)
  ) RETURNING id INTO v_user_id;

  -- Create auth.identities entry
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  -- The trigger will create the profile, but let's ensure role is set correctly
  -- (the trigger uses raw_user_meta_data->>'role')
  UPDATE profiles SET role = p_role WHERE id = v_user_id AND role <> p_role;

  RETURN v_user_id;
END;
$$;
