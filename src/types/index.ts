export type UserRole = 'citizen' | 'officer' | 'admin';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComplaintStatus =
  | 'Submitted'
  | 'AI Classified'
  | 'Department Assigned'
  | 'Officer Assigned'
  | 'In Progress'
  | 'Requesting Information'
  | 'Resolved'
  | 'Escalated'
  | 'Closed';

export type SLARisk = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  location: string | null;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  contact: string | null;
  sla_hours: number;
  category: string;
  created_at: string;
}

export interface Officer {
  id: string;
  user_id: string;
  department_id: string;
  zone: string;
  status: 'active' | 'inactive';
  created_at: string;
  departments?: Department;
  profiles?: Profile;
}

export interface Complaint {
  id: string;
  complaint_number: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  department_id: string | null;
  department: string;
  location: string | null;
  district: string | null;
  area: string | null;
  zone: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  sla_hours: number;
  sla_deadline: string | null;
  ai_confidence: number;
  duplicate_probability: number;
  duplicate_of: string | null;
  estimated_resolution_hours: number;
  sla_risk: SLARisk;
  ai_reason: string | null;
  officer_id: string | null;
  evidence_urls: string[];
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  departments?: Department;
  officers?: Officer;
}

export interface ComplaintUpdate {
  id: string;
  complaint_id: string;
  updated_by: string;
  status: string;
  message: string;
  created_at: string;
  profiles?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  complaint_id: string | null;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Feedback {
  id: string;
  complaint_id: string;
  user_id: string;
  rating: number;
  resolved: boolean;
  comment: string | null;
  created_at: string;
}

export interface AIAnalysisResult {
  category: string;
  department: string;
  departmentId: string | null;
  priority: ComplaintPriority;
  confidence: number;
  duplicateProbability: number;
  estimatedResolutionHours: number;
  slaHours: number;
  slaRisk: SLARisk;
  reason: string;
}
