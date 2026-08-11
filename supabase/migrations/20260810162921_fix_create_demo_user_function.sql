/*
# Fix create_demo_user function to use proper crypt schema

The pgcrypto extension is installed in the public schema, so gen_salt and crypt
need to be referenced with the public schema prefix or the function's search_path
must include public. The function already sets search_path = auth, public, but
let's verify by using explicit schema-qualified calls.
*/

DROP FUNCTION IF EXISTS public.create_demo_user(text, text, text, text, text, text);

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
SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_salt text;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users SET
      encrypted_password = crypt(p_password, gen_salt('bf')),
      raw_user_meta_data = jsonb_build_object(
        'name', p_name,
        'phone', p_phone,
        'role', p_role,
        'location', p_location
      )
    WHERE id = v_user_id;
    UPDATE profiles SET
      name = p_name,
      phone = p_phone,
      role = p_role,
      location = p_location
    WHERE id = v_user_id;
    RETURN v_user_id;
  END IF;

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

  -- Ensure profile exists with correct role
  INSERT INTO profiles (id, name, email, phone, role, location)
  VALUES (v_user_id, p_name, p_email, p_phone, p_role, p_location)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    location = EXCLUDED.location;

  RETURN v_user_id;
END;
$$;
