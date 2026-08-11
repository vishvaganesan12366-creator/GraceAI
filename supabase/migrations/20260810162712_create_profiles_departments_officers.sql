/*
# Create profiles, departments, and officers tables

1. New Tables
  - `profiles`: Extends auth.users with role (citizen/officer/admin), name, phone, location.
  - `departments`: Stores department information (name, description, contact, SLA hours, category).
  - `officers`: Links a user profile to a department and zone for officer assignment.

2. Security
  - RLS enabled on all tables.
  - profiles: users can read/update their own profile; officers/admins can read all profiles.
  - departments: all authenticated users can read; only admins can modify.
  - officers: all authenticated users can read; only admins can modify.

3. Notes
  - `profiles.id` references `auth.users(id)` with CASCADE delete.
  - `profiles.role` is restricted to 'citizen', 'officer', 'admin' via CHECK constraint.
*/

-- Profiles table (extends auth.users) — must exist before departments policies reference it
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'officer', 'admin')),
  location text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_profile" ON profiles;
CREATE POLICY "read_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "read_all_profiles_staff" ON profiles;
CREATE POLICY "read_all_profiles_staff" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('officer', 'admin'))
  );

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  contact text,
  sla_hours integer NOT NULL DEFAULT 48,
  category text NOT NULL DEFAULT 'Other',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_departments" ON departments;
CREATE POLICY "read_departments" ON departments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_departments" ON departments;
CREATE POLICY "admin_insert_departments" ON departments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_departments" ON departments;
CREATE POLICY "admin_update_departments" ON departments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_departments" ON departments;
CREATE POLICY "admin_delete_departments" ON departments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Officers table (links profiles to departments)
CREATE TABLE IF NOT EXISTS officers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  zone text NOT NULL DEFAULT 'Zone A',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE officers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_officers" ON officers;
CREATE POLICY "read_officers" ON officers FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_officers" ON officers;
CREATE POLICY "admin_insert_officers" ON officers FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_officers" ON officers;
CREATE POLICY "admin_update_officers" ON officers FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_officers" ON officers;
CREATE POLICY "admin_delete_officers" ON officers FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_officers_user_id ON officers(user_id);
CREATE INDEX IF NOT EXISTS idx_officers_department_id ON officers(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
