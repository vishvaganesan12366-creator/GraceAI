/*
# Seed complaints with realistic data

Creates 50 realistic complaints with varied:
- Categories (Road, Water, Electricity, Sanitation, Health, Police, Transport, Education)
- Departments (matching categories)
- Priorities (LOW, MEDIUM, HIGH, CRITICAL)
- Statuses (Submitted through Resolved)
- AI analysis fields (confidence, duplicate_probability, estimated_resolution_hours, sla_risk)
- SLA deadlines computed from created_at + sla_hours
- Zones (A, B, C, D)
- Various citizens as complaint submitters
- Complaint numbers like GRV-2026-XXXXX

Also creates complaint_updates, notifications, and feedback for resolved complaints.
*/

-- Create a function to generate complaint numbers
CREATE OR REPLACE FUNCTION public.generate_complaint_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer;
  v_number text;
BEGIN
  SELECT COUNT(*) + 10001 INTO v_count FROM complaints;
  v_number := 'GRV-2026-' || lpad(v_count::text, 5, '0');
  RETURN v_number;
END;
$$;

-- Seed complaints using a data generation approach
-- We'll insert complaints with varied data
DO $$
DECLARE
  v_citizen_ids uuid[] := ARRAY[
    '887079bd-b3ee-4a9f-a050-e75111b01ad8',
    '80898a7b-0787-4b53-b6a9-f116e6e08330',
    'a180987c-6151-46da-94d8-2a4b38a042ae',
    '67080b32-ab09-4a20-a9dd-53a6bdd31bc0',
    'efbc2d27-5c6a-4806-9296-45c875c9ba4e'
  ];
  v_dept_ids RECORD;
  v_officer_ids RECORD;
  v_complaint_id uuid;
  v_complaint_number text;
  v_created_at timestamptz;
  v_sla_hours int;
  v_sla_deadline timestamptz;
  v_i int;
  v_title text;
  v_desc text;
  v_category text;
  v_department text;
  v_dept_id uuid;
  v_priority text;
  v_status text;
  v_zone text;
  v_confidence numeric;
  v_dup_prob numeric;
  v_est_hours int;
  v_sla_risk text;
  v_ai_reason text;
  v_citizen_idx int;
  v_officer_id uuid;
BEGIN
  -- Get department IDs
  SELECT 
    (SELECT id FROM departments WHERE name = 'Municipal Engineering') AS municipal,
    (SELECT id FROM departments WHERE name = 'Water Supply') AS water,
    (SELECT id FROM departments WHERE name = 'Electricity') AS electricity,
    (SELECT id FROM departments WHERE name = 'Sanitation') AS sanitation,
    (SELECT id FROM departments WHERE name = 'Public Health') AS health,
    (SELECT id FROM departments WHERE name = 'Police') AS police,
    (SELECT id FROM departments WHERE name = 'Transport') AS transport,
    (SELECT id FROM departments WHERE name = 'Education') AS education
  INTO v_dept_ids;

  -- Get officer IDs
  SELECT 
    (SELECT o.id FROM officers o JOIN auth.users u ON o.user_id = u.id WHERE u.email = 'officer@grace.ai') AS municipal_o,
    (SELECT o.id FROM officers o JOIN auth.users u ON o.user_id = u.id WHERE u.email = 'officer.water@grace.ai') AS water_o,
    (SELECT o.id FROM officers o JOIN auth.users u ON o.user_id = u.id WHERE u.email = 'officer.elec@grace.ai') AS elec_o,
    (SELECT o.id FROM officers o JOIN auth.users u ON o.user_id = u.id WHERE u.email = 'officer.sanit@grace.ai') AS sanit_o,
    (SELECT o.id FROM officers o JOIN auth.users u ON o.user_id = u.id WHERE u.email = 'officer.health@grace.ai') AS health_o,
    (SELECT o.id FROM officers o JOIN auth.users u ON o.user_id = u.id WHERE u.email = 'officer.police@grace.ai') AS police_o,
    (SELECT o.id FROM officers o JOIN auth.users u ON o.user_id = u.id WHERE u.email = 'officer.transport@grace.ai') AS transport_o,
    (SELECT o.id FROM officers o JOIN auth.users u ON o.user_id = u.id WHERE u.email = 'officer.edu@grace.ai') AS edu_o
  INTO v_officer_ids;

  -- Complaint definitions: (title, description, category, department, dept_id, sla_hours, priority, zone, officer_id, confidence, dup_prob, est_hours, sla_risk, ai_reason, status, days_ago)
  -- We'll use an array of composite values
  FOR v_i IN 1..50 LOOP
    v_complaint_number := public.generate_complaint_number();
    v_citizen_idx := (v_i % 5) + 1;
    v_created_at := now() - (random() * 30 + 1) * interval '1 day';
    
    CASE v_i % 8
      WHEN 0 THEN
        v_title := 'Large pothole near college entrance causing accidents';
        v_desc := 'There is a large pothole near the college entrance and several people are having difficulty travelling. Two-wheeler riders are falling frequently.';
        v_category := 'Road Infrastructure';
        v_department := 'Municipal Engineering';
        v_dept_id := v_dept_ids.municipal;
        v_sla_hours := 48;
        v_officer_id := v_officer_ids.municipal_o;
        v_zone := CASE v_i % 4 WHEN 0 THEN 'Zone A' WHEN 1 THEN 'Zone B' WHEN 2 THEN 'Zone C' ELSE 'Zone D' END;
        v_ai_reason := 'The complaint describes a road safety issue affecting public transportation and pedestrian safety.';
      WHEN 1 THEN
        v_title := 'Street light not working for 5 days';
        v_desc := 'The street light near my house has not been working for 5 days. The area is completely dark at night and feels unsafe.';
        v_category := 'Electricity';
        v_department := 'Electricity';
        v_dept_id := v_dept_ids.electricity;
        v_sla_hours := 24;
        v_officer_id := v_officer_ids.elec_o;
        v_zone := CASE v_i % 4 WHEN 0 THEN 'Zone A' WHEN 1 THEN 'Zone B' WHEN 2 THEN 'Zone C' ELSE 'Zone D' END;
        v_ai_reason := 'The complaint describes a street lighting failure affecting public safety in the area.';
      WHEN 2 THEN
        v_title := 'Water leakage from main pipeline';
        v_desc := 'There is continuous water leakage from the main pipeline on 4th street. Large amount of water being wasted daily.';
        v_category := 'Water Supply';
        v_department := 'Water Supply';
        v_dept_id := v_dept_ids.water;
        v_sla_hours := 24;
        v_officer_id := v_officer_ids.water_o;
        v_zone := CASE v_i % 4 WHEN 0 THEN 'Zone A' WHEN 1 THEN 'Zone B' WHEN 2 THEN 'Zone C' ELSE 'Zone D' END;
        v_ai_reason := 'The complaint reports a water pipeline leakage causing resource wastage and potential water shortage.';
      WHEN 3 THEN
        v_title := 'Garbage not collected for over a week';
        v_desc := 'Garbage has not been collected in our area for over a week. The pile is growing and causing bad smell and health concerns.';
        v_category := 'Sanitation';
        v_department := 'Sanitation';
        v_dept_id := v_dept_ids.sanitation;
        v_sla_hours := 72;
        v_officer_id := v_officer_ids.sanit_o;
        v_zone := CASE v_i % 4 WHEN 0 THEN 'Zone A' WHEN 1 THEN 'Zone B' WHEN 2 THEN 'Zone C' ELSE 'Zone D' END;
        v_ai_reason := 'The complaint describes a sanitation issue with potential public health implications due to uncollected waste.';
      WHEN 4 THEN
        v_title := 'Mosquito breeding in stagnant water';
        v_desc := 'There is stagnant water near the drainage canal causing severe mosquito breeding. Dengue risk is high in the neighborhood.';
        v_category := 'Healthcare';
        v_department := 'Public Health';
        v_dept_id := v_dept_ids.health;
        v_sla_hours := 48;
        v_officer_id := v_officer_ids.health_o;
        v_zone := CASE v_i % 4 WHEN 0 THEN 'Zone A' WHEN 1 THEN 'Zone B' WHEN 2 THEN 'Zone C' ELSE 'Zone D' END;
        v_ai_reason := 'The complaint describes a public health hazard with mosquito breeding and disease risk.';
      WHEN 5 THEN
        v_title := 'Frequent theft incidents in the neighborhood';
        v_desc := 'There have been multiple theft incidents in our neighborhood over the past two weeks. Requesting increased police patrol.';
        v_category := 'Public Safety';
        v_department := 'Police';
        v_dept_id := v_dept_ids.police;
        v_sla_hours := 12;
        v_officer_id := v_officer_ids.police_o;
        v_zone := CASE v_i % 4 WHEN 0 THEN 'Zone A' WHEN 1 THEN 'Zone B' WHEN 2 THEN 'Zone C' ELSE 'Zone D' END;
        v_ai_reason := 'The complaint reports criminal activity and requests immediate law enforcement attention.';
      WHEN 6 THEN
        v_title := 'Traffic signal not working at main junction';
        v_desc := 'The traffic signal at the main junction has been malfunctioning for 3 days causing severe traffic jams during peak hours.';
        v_category := 'Transport';
        v_department := 'Transport';
        v_dept_id := v_dept_ids.transport;
        v_sla_hours := 48;
        v_officer_id := v_officer_ids.transport_o;
        v_zone := CASE v_i % 4 WHEN 0 THEN 'Zone A' WHEN 1 THEN 'Zone B' WHEN 2 THEN 'Zone C' ELSE 'Zone D' END;
        v_ai_reason := 'The complaint describes a traffic infrastructure issue causing public inconvenience and safety risks.';
      ELSE
        v_title := 'School building roof leaking during rains';
        v_desc := 'The government school building roof is leaking heavily during rains. Children are unable to attend classes properly.';
        v_category := 'Education';
        v_department := 'Education';
        v_dept_id := v_dept_ids.education;
        v_sla_hours := 120;
        v_officer_id := v_officer_ids.edu_o;
        v_zone := CASE v_i % 4 WHEN 0 THEN 'Zone A' WHEN 1 THEN 'Zone B' WHEN 2 THEN 'Zone C' ELSE 'Zone D' END;
        v_ai_reason := 'The complaint describes an educational infrastructure issue affecting student learning conditions.';
    END CASE;

    -- Determine priority based on index
    v_priority := CASE 
      WHEN v_i % 7 = 0 THEN 'CRITICAL'
      WHEN v_i % 3 = 0 THEN 'HIGH'
      WHEN v_i % 3 = 1 THEN 'MEDIUM'
      ELSE 'LOW'
    END;

    -- Determine status based on age
    IF v_i <= 10 THEN
      v_status := 'Submitted';
    ELSIF v_i <= 20 THEN
      v_status := 'In Progress';
    ELSIF v_i <= 30 THEN
      v_status := 'Resolved';
    ELSIF v_i <= 38 THEN
      v_status := 'Escalated';
    ELSIF v_i <= 44 THEN
      v_status := 'Officer Assigned';
    ELSE
      v_status := 'Department Assigned';
    END IF;

    -- Adjust SLA hours for critical/low priority
    v_sla_hours := CASE v_priority
      WHEN 'CRITICAL' THEN LEAST(v_sla_hours, 12)
      WHEN 'HIGH' THEN LEAST(v_sla_hours, 24)
      WHEN 'MEDIUM' THEN v_sla_hours
      ELSE v_sla_hours + 24
    END;

    v_sla_deadline := v_created_at + (v_sla_hours || ' hours')::interval;
    v_confidence := 85 + (random() * 14);
    v_dup_prob := (random() * 30);
    v_est_hours := v_sla_hours - (random() * 6)::int;
    v_sla_risk := CASE 
      WHEN v_status = 'Escalated' THEN 'HIGH'
      WHEN v_i % 4 = 0 THEN 'MEDIUM'
      ELSE 'LOW'
    END;

    INSERT INTO complaints (
      complaint_number, user_id, title, description, category,
      department_id, department, location, district, area, zone,
      priority, status, sla_hours, sla_deadline,
      ai_confidence, duplicate_probability, estimated_resolution_hours,
      sla_risk, ai_reason, officer_id, created_at, updated_at
    ) VALUES (
      v_complaint_number,
      v_citizen_ids[v_citizen_idx],
      v_title, v_desc, v_category,
      v_dept_id, v_department,
      CASE v_zone WHEN 'Zone A' THEN 'Kattur' WHEN 'Zone B' THEN 'Ariyamangalam' WHEN 'Zone C' THEN 'Woraiyur' ELSE 'Srirangam' END,
      'Tiruchirappalli',
      CASE v_zone WHEN 'Zone A' THEN 'Ward 12' WHEN 'Zone B' THEN 'Ward 23' WHEN 'Zone C' THEN 'Ward 34' ELSE 'Ward 45' END,
      v_zone,
      v_priority, v_status, v_sla_hours, v_sla_deadline,
      v_confidence, v_dup_prob, v_est_hours,
      v_sla_risk, v_ai_reason, v_officer_id, v_created_at, v_created_at
    ) RETURNING id INTO v_complaint_id;

    -- Create complaint updates based on status
    INSERT INTO complaint_updates (complaint_id, updated_by, status, message, created_at)
    VALUES (v_complaint_id, v_citizen_ids[v_citizen_idx], 'Submitted', 'Complaint submitted by citizen', v_created_at);

    IF v_status IN ('AI Classified', 'Department Assigned', 'Officer Assigned', 'In Progress', 'Requesting Information', 'Resolved', 'Escalated', 'Closed') THEN
      INSERT INTO complaint_updates (complaint_id, updated_by, status, message, created_at)
      VALUES (v_complaint_id, v_citizen_ids[v_citizen_idx], 'AI Classified', 'GRACE AI classified the complaint with ' || round(v_confidence) || '% confidence', v_created_at + interval '1 minute');
    END IF;

    IF v_status IN ('Department Assigned', 'Officer Assigned', 'In Progress', 'Requesting Information', 'Resolved', 'Escalated', 'Closed') THEN
      INSERT INTO complaint_updates (complaint_id, updated_by, status, message, created_at)
      VALUES (v_complaint_id, v_citizen_ids[v_citizen_idx], 'Department Assigned', 'Routed to ' || v_department, v_created_at + interval '5 minutes');
    END IF;

    IF v_status IN ('Officer Assigned', 'In Progress', 'Requesting Information', 'Resolved', 'Escalated', 'Closed') THEN
      INSERT INTO complaint_updates (complaint_id, updated_by, status, message, created_at)
      VALUES (v_complaint_id, v_citizen_ids[v_citizen_idx], 'Officer Assigned', 'Officer assigned to handle the complaint', v_created_at + interval '15 minutes');
    END IF;

    IF v_status IN ('In Progress', 'Requesting Information', 'Resolved', 'Escalated', 'Closed') THEN
      INSERT INTO complaint_updates (complaint_id, updated_by, status, message, created_at)
      VALUES (v_complaint_id, v_citizen_ids[v_citizen_idx], 'In Progress', 'Investigation started by assigned officer', v_created_at + interval '2 hours');
    END IF;

    IF v_status IN ('Resolved', 'Closed') THEN
      INSERT INTO complaint_updates (complaint_id, updated_by, status, message, created_at)
      VALUES (v_complaint_id, v_citizen_ids[v_citizen_idx], 'Resolved', 'Issue has been resolved by the department', v_created_at + (v_est_hours || ' hours')::interval);
    END IF;

    IF v_status = 'Escalated' THEN
      INSERT INTO complaint_updates (complaint_id, updated_by, status, message, created_at)
      VALUES (v_complaint_id, v_citizen_ids[v_citizen_idx], 'Escalated', 'Complaint escalated due to SLA violation', v_sla_deadline);
    END IF;

    -- Create notifications
    INSERT INTO notifications (user_id, complaint_id, message, type, is_read, created_at)
    VALUES (v_citizen_ids[v_citizen_idx], v_complaint_id, 'Your complaint ' || v_complaint_number || ' has been submitted and is being processed.', 'info', (random() > 0.5), v_created_at);

    IF v_status IN ('Department Assigned', 'Officer Assigned', 'In Progress', 'Requesting Information', 'Resolved', 'Escalated', 'Closed') THEN
      INSERT INTO notifications (user_id, complaint_id, message, type, is_read, created_at)
      VALUES (v_citizen_ids[v_citizen_idx], v_complaint_id, 'Your complaint ' || v_complaint_number || ' has been assigned to ' || v_department || '.', 'info', (random() > 0.5), v_created_at + interval '5 minutes');
    END IF;

    IF v_status IN ('Resolved', 'Closed') THEN
      INSERT INTO notifications (user_id, complaint_id, message, type, is_read, created_at)
      VALUES (v_citizen_ids[v_citizen_idx], v_complaint_id, 'Your complaint ' || v_complaint_number || ' has been resolved. Please provide feedback.', 'success', (random() > 0.5), v_created_at + (v_est_hours || ' hours')::interval);
    END IF;

    -- Create feedback for resolved complaints
    IF v_status IN ('Resolved', 'Closed') AND v_i <= 25 THEN
      INSERT INTO feedback (complaint_id, user_id, rating, resolved, comment, created_at)
      VALUES (
        v_complaint_id, v_citizen_ids[v_citizen_idx],
        3 + (random() * 2)::int,
        true,
        CASE (v_i % 3)
          WHEN 0 THEN 'Issue was resolved quickly. Thank you.'
          WHEN 1 THEN 'Good service, satisfied with the response.'
          ELSE 'Took some time but the issue is fixed now.'
        END,
        v_created_at + (v_est_hours || ' hours')::interval + interval '1 hour'
      );
    END IF;

  END LOOP;
END $$;
