export type RegistrationStatus = 
  | 'DRAFT' 
  | 'PAYMENT_PENDING' 
  | 'VERIFICATION_PENDING' 
  | 'RESUBMISSION_REQUIRED' 
  | 'CONFIRMED' 
  | 'REJECTED';

export type AssignmentStatus = 'UNASSIGNED' | 'ASSIGNED';
export type RevealStatus = 'HIDDEN' | 'REVEALED';
export type CommitteeFormat = 'INDIVIDUAL' | 'TEAM';
export type UserRole = 'participant' | 'admin';
export type FeeCategory = 'ISE' | 'NON_ISE' | 'EXTERNAL' | 'SPECIAL';

export interface UserProfile {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Committee {
  id: string;
  name: string;
  slug: string;
  short_name: string;
  hook: string;
  description: string;
  format: CommitteeFormat;
  team_min_size: number;
  team_max_size: number;
  date_text: string;
  venue_text: string;
  registration_fee: number;
  capacity: number;
  is_open: boolean;
  public_capacity_visibility: boolean;
  display_order: number;
  visual_config: {
    theme?: string;
    accent?: string;
    badge?: string;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

export interface PricingRule {
  id: string;
  committee_id: string;
  category: FeeCategory;
  amount: number;
  currency: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Portfolio {
  id: string;
  committee_id: string;
  name: string;
  description: string;
  short_description: string;
  capacity: number;
  is_active: boolean;
  display_order: number;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface Registration {
  id: string;
  registration_number: string;
  auth_user_id: string;
  committee_id: string;
  registration_type: CommitteeFormat;
  status: RegistrationStatus;
  contact_email: string;
  preferences_locked: boolean;
  assignment_status: AssignmentStatus;
  reveal_status: RevealStatus;
  confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IndividualParticipant {
  id: string;
  registration_id: string;
  full_name: string;
  usn: string;
  email: string;
  branch: string;
  year: string;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Team {
  id: string;
  registration_id: string;
  team_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  full_name: string;
  usn: string;
  email: string;
  branch: string;
  year: string;
  is_leader: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Preference {
  id: string;
  registration_id: string;
  portfolio_id: string;
  rank: 1 | 2 | 3;
  locked_at: string;
}

export interface Payment {
  id: string;
  registration_id: string;
  amount: number;
  currency: string;
  pricing_rule_id?: string | null;
  pricing_category: string;
  original_amount?: number | null;
  override_amount?: number | null;
  override_reason?: string | null;
  overridden_by?: string | null;
  overridden_at?: string | null;
  utr: string;
  screenshot_path: string;
  status: 'SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'RESUBMISSION_REQUIRED';
  rejection_reason?: string | null;
  submitted_at: string;
  verified_at?: string | null;
  rejected_at?: string | null;
  verified_by?: string | null;
}

export interface Assignment {
  id: string;
  registration_id: string;
  portfolio_id: string;
  preference_rank?: number | null;
  assignment_type: 'AUTOMATIC' | 'MANUAL';
  assignment_run_id?: string | null;
  previous_portfolio_id?: string | null;
  override_reason?: string | null;
  assigned_by?: string | null;
  assigned_at: string;
}

export interface Reveal {
  id: string;
  registration_id: string;
  mode: 'CINEMATIC' | 'SIMPLE';
  revealed_at: string;
  revealed_by?: string | null;
}

export interface AssignmentRun {
  id: string;
  committee_id: string;
  run_type: string;
  created_by?: string | null;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  created_at: string;
}

export interface AppSettings {
  name: string;
  dates: string;
  venue: string;
  registration_open: boolean;
  upi_id: string;
  qr_code_url: string;
  support_contact: string;
  whatsapp_configured: boolean;
  email_configured: boolean;
}

// Complete hydrated registration for Dashboards & Admin inspection
export interface FullRegistrationDetail {
  registration: Registration;
  committee?: Committee;
  individual?: IndividualParticipant;
  team?: Team;
  team_members?: TeamMember[];
  preferences: (Preference & { portfolio?: Portfolio })[];
  payment?: Payment;
  assignment?: Assignment & { portfolio?: Portfolio };
  reveal?: Reveal;
}
