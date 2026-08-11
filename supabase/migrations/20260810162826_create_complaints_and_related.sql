/*
# Create complaints, complaint_updates, notifications, and feedback tables

1. New Tables
  - `complaints`: Core table storing all grievance complaints with AI analysis fields.
  - `complaint_updates`: Status update history for each complaint.
  - `notifications`: User notifications for various events.
  - `feedback`: Citizen feedback after complaint resolution.

2. Security
  - RLS enabled on all tables.
  - complaints: citizens can CRUD their own; officers can read/update complaints in their department; admins can read/update all.
  - complaint_updates: citizens can read updates on their complaints; officers can insert updates for their department complaints; admins can read all.
  - notifications: users can read/update their own notifications.
  - feedback: citizens can insert/read their own feedback; officers/admins can read feedback for their department/all complaints.

3. Notes
  - Complaints have AI fields: ai_confidence, duplicate_probability, estimated_resolution_hours, sla_risk.
  - SLA is calculated from sla_hours and created_at; sla_deadline is stored for quick lookup.
  - complaint_number is a human-readable unique ID like GRV-2026-XXXXX.
*/

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  department text NOT NULL DEFAULT 'Unassigned',
  location text,
  district text,
  area text,
  zone text DEFAULT 'Zone A',
  priority text NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status text NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'AI Classified', 'Department Assigned', 'Officer Assigned', 'In Progress', 'Requesting Information', 'Resolved', 'Escalated', 'Closed')),
  sla_hours integer NOT NULL DEFAULT 48,
  sla_deadline timestamptz,
  ai_confidence numeric DEFAULT 0,
  duplicate_probability numeric DEFAULT 0,
  duplicate_of uuid REFERENCES complaints(id) ON DELETE SET NULL,
  estimated_resolution_hours integer DEFAULT 48,
  sla_risk text DEFAULT 'LOW' CHECK (sla_risk IN ('LOW', 'MEDIUM', 'HIGH')),
  ai_reason text,
  officer_id uuid REFERENCES officers(id) ON DELETE SET NULL,
  evidence_urls text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_complaints" ON complaints;
CREATE POLICY "select_own_complaints" ON complaints FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_dept_complaints" ON complaints;
CREATE POLICY "select_dept_complaints" ON complaints FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM officers o
      WHERE o.user_id = auth.uid()
      AND o.department_id = complaints.department_id
    )
  );

DROP POLICY IF EXISTS "select_all_complaints_admin" ON complaints;
CREATE POLICY "select_all_complaints_admin" ON complaints FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_complaints" ON complaints;
CREATE POLICY "insert_own_complaints" ON complaints FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_complaints" ON complaints;
CREATE POLICY "update_own_complaints" ON complaints FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_dept_complaints" ON complaints;
CREATE POLICY "update_dept_complaints" ON complaints FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM officers o
      WHERE o.user_id = auth.uid()
      AND o.department_id = complaints.department_id
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers o
      WHERE o.user_id = auth.uid()
      AND o.department_id = complaints.department_id
    )
  );

DROP POLICY IF EXISTS "update_all_complaints_admin" ON complaints;
CREATE POLICY "update_all_complaints_admin" ON complaints FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "delete_all_complaints_admin" ON complaints;
CREATE POLICY "delete_all_complaints_admin" ON complaints FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Complaint updates table
CREATE TABLE IF NOT EXISTS complaint_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  updated_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_complaint_updates" ON complaint_updates;
CREATE POLICY "select_own_complaint_updates" ON complaint_updates FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM complaints c
      WHERE c.id = complaint_updates.complaint_id
      AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "select_dept_complaint_updates" ON complaint_updates;
CREATE POLICY "select_dept_complaint_updates" ON complaint_updates FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM complaints c
      JOIN officers o ON o.department_id = c.department_id
      WHERE c.id = complaint_updates.complaint_id
      AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "select_all_complaint_updates_admin" ON complaint_updates;
CREATE POLICY "select_all_complaint_updates_admin" ON complaint_updates FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "insert_complaint_updates" ON complaint_updates;
CREATE POLICY "insert_complaint_updates" ON complaint_updates FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM complaints c
      WHERE c.id = complaint_updates.complaint_id
      AND c.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM complaints c
      JOIN officers o ON o.department_id = c.department_id
      WHERE c.id = complaint_updates.complaint_id
      AND o.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  complaint_id uuid REFERENCES complaints(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  resolved boolean DEFAULT true,
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_feedback" ON feedback;
CREATE POLICY "select_own_feedback" ON feedback FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_dept_feedback" ON feedback;
CREATE POLICY "select_dept_feedback" ON feedback FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM complaints c
      JOIN officers o ON o.department_id = c.department_id
      WHERE c.id = feedback.complaint_id
      AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "select_all_feedback_admin" ON feedback;
CREATE POLICY "select_all_feedback_admin" ON feedback FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_feedback" ON feedback;
CREATE POLICY "insert_own_feedback" ON feedback FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_department_id ON complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_complaint_id ON complaint_updates(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_complaint_id ON feedback(complaint_id);
