/*
# Create auto-profile trigger and seed departments

1. Changes
  - Creates a trigger function `handle_new_user()` that auto-inserts a row into `profiles` when a new auth.users row is created.
  - The profile is created with role 'citizen' by default, using the user's email and metadata name.
  - Creates a trigger `on_auth_user_created` that fires AFTER INSERT on auth.users.
  - Seeds the `departments` table with 8 departments matching the spec.

2. Security
  - The trigger function runs as SECURITY DEFINER so it can insert into profiles even though the caller is anon.
  - The function is owned by the postgres user.

3. Notes
  - This ensures every new signup automatically gets a profile row.
  - The role defaults to 'citizen'; admin/officer roles are assigned via the seed migration or admin UI.
*/

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, role, location)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
    NEW.raw_user_meta_data->>'location'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed departments
INSERT INTO departments (name, description, contact, sla_hours, category) VALUES
  ('Municipal Engineering', 'Handles road infrastructure, potholes, public construction, and municipal maintenance', 'contact@municipal.gov', 48, 'Road Infrastructure'),
  ('Water Supply', 'Manages water supply, pipelines, leakage, and water quality issues', 'contact@water.gov', 24, 'Water Supply'),
  ('Electricity', 'Handles street lighting, power outages, and electrical infrastructure', 'contact@electricity.gov', 24, 'Electricity'),
  ('Sanitation', 'Manages waste collection, drainage, and public sanitation', 'contact@sanitation.gov', 72, 'Sanitation'),
  ('Public Health', 'Handles public health concerns, hospital services, and sanitation-related health issues', 'contact@health.gov', 48, 'Healthcare'),
  ('Police', 'Handles public safety, law enforcement, and security concerns', 'contact@police.gov', 12, 'Public Safety'),
  ('Transport', 'Manages public transport, traffic signals, and road safety infrastructure', 'contact@transport.gov', 48, 'Transport'),
  ('Education', 'Handles school infrastructure, education services, and related facilities', 'contact@education.gov', 120, 'Education')
ON CONFLICT (name) DO NOTHING;
