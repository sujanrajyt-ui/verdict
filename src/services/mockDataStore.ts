import { 
  Committee, 
  PricingRule, 
  Portfolio, 
  Registration, 
  IndividualParticipant, 
  Team, 
  TeamMember, 
  Preference, 
  Payment, 
  Assignment, 
  Reveal, 
  AssignmentRun, 
  AuditLog, 
  AppSettings,
  UserProfile 
} from '../types';

const STORAGE_KEY = 'vista_the_verdict_data_v1';

export interface DataStore {
  committees: Committee[];
  pricingRules: PricingRule[];
  portfolios: Portfolio[];
  registrations: Registration[];
  individualParticipants: IndividualParticipant[];
  teams: Team[];
  teamMembers: TeamMember[];
  preferences: Preference[];
  payments: Payment[];
  assignments: Assignment[];
  reveals: Reveal[];
  assignmentRuns: AssignmentRun[];
  auditLogs: AuditLog[];
  appSettings: AppSettings;
  users: UserProfile[];
  currentUser: UserProfile | null;
}

const defaultCommittees: Committee[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'BOLLYWOOD SAGA',
    slug: 'bollywood-saga',
    short_name: 'BOLLYWOOD',
    hook: "Build India's next billion-dollar blockbuster.",
    description: "Step into the ruthless epicenter of Indian cinema. Pitch stories, secure talent, survive scandals, navigate box office warfare, and construct a legacy that echoes across generations.",
    format: 'INDIVIDUAL',
    team_min_size: 1,
    team_max_size: 1,
    date_text: '16–17 October',
    venue_text: 'APJ Block, NMAMIT',
    registration_fee: 350,
    capacity: 60,
    is_open: true,
    public_capacity_visibility: true,
    display_order: 1,
    visual_config: {
      theme: 'crimson',
      accent: '#DC2626',
      badge: 'CINEMA SIMULATION',
      tagline: 'HIGH-STAKES SHOWBIZ & DEALMAKING'
    }
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'IPL MEGA AUCTION 2027',
    slug: 'ipl-mega-auction',
    short_name: 'IPL AUCTION',
    hook: 'Build your franchise. Outbid everyone.',
    description: 'High-stakes bidding warfare. Balance your purse, exploit auction dynamics, manage marquee player demands, build unmatched squad depth, and claim the championship crown before the hammer strikes.',
    format: 'TEAM',
    team_min_size: 2,
    team_max_size: 3,
    date_text: '16–17 October',
    venue_text: 'APJ Block, NMAMIT',
    registration_fee: 750,
    capacity: 30,
    is_open: true,
    public_capacity_visibility: true,
    display_order: 2,
    visual_config: {
      theme: 'gold',
      accent: '#F59E0B',
      badge: 'TEAM AUCTION WAR ROOM',
      tagline: 'STRATEGIC CRICKET PURSE WARFARE'
    }
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'LOK SABHA',
    slug: 'lok-sabha',
    short_name: 'LOK SABHA',
    hook: 'Power. Policy. Politics.',
    description: 'The floor of the sovereign Parliament is open. Table historic bills, broker backroom coalitions, deliver thunderous orations, outmaneuver political rebellions, and defend national sovereignty.',
    format: 'INDIVIDUAL',
    team_min_size: 1,
    team_max_size: 1,
    date_text: '16–17 October',
    venue_text: 'APJ Block, NMAMIT',
    registration_fee: 350,
    capacity: 60,
    is_open: true,
    public_capacity_visibility: true,
    display_order: 3,
    visual_config: {
      theme: 'slate',
      accent: '#38BDF8',
      badge: 'PARLIAMENTARY ARENA',
      tagline: 'GOVERNANCE, LEGISLATION & COALITIONS'
    }
  }
];

const defaultPricingRules: PricingRule[] = [
  // Bollywood Saga
  {
    id: 'p-rule-101',
    committee_id: '11111111-1111-1111-1111-111111111111',
    category: 'ISE',
    amount: 250,
    currency: 'INR',
    is_active: true
  },
  {
    id: 'p-rule-102',
    committee_id: '11111111-1111-1111-1111-111111111111',
    category: 'NON_ISE',
    amount: 350,
    currency: 'INR',
    is_active: true
  },
  // IPL Mega Auction (Team Fee)
  {
    id: 'p-rule-201',
    committee_id: '22222222-2222-2222-2222-222222222222',
    category: 'ISE',
    amount: 600,
    currency: 'INR',
    is_active: true
  },
  {
    id: 'p-rule-202',
    committee_id: '22222222-2222-2222-2222-222222222222',
    category: 'NON_ISE',
    amount: 750,
    currency: 'INR',
    is_active: true
  },
  // Lok Sabha
  {
    id: 'p-rule-301',
    committee_id: '33333333-3333-3333-3333-333333333333',
    category: 'ISE',
    amount: 250,
    currency: 'INR',
    is_active: true
  },
  {
    id: 'p-rule-302',
    committee_id: '33333333-3333-3333-3333-333333333333',
    category: 'NON_ISE',
    amount: 350,
    currency: 'INR',
    is_active: true
  }
];

const defaultPortfolios: Portfolio[] = [
  // Bollywood Saga
  {
    id: 'port-b-1',
    committee_id: '11111111-1111-1111-1111-111111111111',
    name: 'Visionary Studio Producer',
    description: 'Controls production finance, greenlights script budgets, and leads national theatrical distribution.',
    short_description: 'Production & Finance Executive',
    capacity: 10,
    is_active: true,
    display_order: 1
  },
  {
    id: 'port-b-2',
    committee_id: '11111111-1111-1111-1111-111111111111',
    name: 'Auteur Film Director',
    description: 'Commanding the creative vision, casting dynamics, and auteur cinematic aesthetics on set.',
    short_description: 'Creative Mastermind',
    capacity: 10,
    is_active: true,
    display_order: 2
  },
  {
    id: 'port-b-3',
    committee_id: '11111111-1111-1111-1111-111111111111',
    name: 'Superstar Celebrity Lead',
    description: 'Commands massive fan equity, unprecedented box office pull, and lucrative brand endorsement power.',
    short_description: 'Top-Billing Actor / Box Office Anchor',
    capacity: 10,
    is_active: true,
    display_order: 3
  },
  {
    id: 'port-b-4',
    committee_id: '11111111-1111-1111-1111-111111111111',
    name: 'Aggressive Media Mogul',
    description: 'Dictates tabloid PR narratives, orchestrated scandal campaigns, and opening weekend hysteria.',
    short_description: 'Tabloid & Press Magnate',
    capacity: 10,
    is_active: true,
    display_order: 4
  },
  {
    id: 'port-b-5',
    committee_id: '11111111-1111-1111-1111-111111111111',
    name: 'OTT Streaming Tycoon',
    description: 'Monopolizes global digital streaming rights, algorithmic hype, and non-linear premiere releases.',
    short_description: 'Global Digital Distribution Chief',
    capacity: 10,
    is_active: true,
    display_order: 5
  },
  {
    id: 'port-b-6',
    committee_id: '11111111-1111-1111-1111-111111111111',
    name: 'Renowned Screenplay Architect',
    description: 'Crafts dialogues, narrative plot twists, and high-voltage emotional climax arcs.',
    short_description: 'Master Scriptwriter & Showrunner',
    capacity: 10,
    is_active: true,
    display_order: 6
  },

  // IPL Mega Auction 2027
  {
    id: 'port-i-1',
    committee_id: '22222222-2222-2222-2222-222222222222',
    name: 'Mumbai Indians Think Tank',
    description: 'Data-driven dynasty builder with unmatched scout network and winning championship pedigree.',
    short_description: '5-Time Championship Franchise War Room',
    capacity: 5,
    is_active: true,
    display_order: 1
  },
  {
    id: 'port-i-2',
    committee_id: '22222222-2222-2222-2222-222222222222',
    name: 'Chennai Super Kings Council',
    description: 'Masters of clutch strategy, experienced leadership, and fortress Chepauk dominance.',
    short_description: 'Yellow Army Strategic Council',
    capacity: 5,
    is_active: true,
    display_order: 2
  },
  {
    id: 'port-i-3',
    committee_id: '22222222-2222-2222-2222-222222222222',
    name: 'Royal Challengers Bengaluru Board',
    description: 'High-voltage brand power, explosive batting philosophies, and passionate fan capital.',
    short_description: 'Bold & Audacious Franchise',
    capacity: 5,
    is_active: true,
    display_order: 3
  },
  {
    id: 'port-i-4',
    committee_id: '22222222-2222-2222-2222-222222222222',
    name: 'Kolkata Knight Riders Syndicate',
    description: 'Moneyball pioneers, spin choke tacticians, and aggressive purse manipulators.',
    short_description: 'Knights Auction Syndicate',
    capacity: 5,
    is_active: true,
    display_order: 4
  },
  {
    id: 'port-i-5',
    committee_id: '22222222-2222-2222-2222-222222222222',
    name: 'Sunrisers Hyderabad Command',
    description: 'All-out blitzkrieg, record-breaking strike rates, and precision fast bowling unit.',
    short_description: 'Orange Army Strike Group',
    capacity: 5,
    is_active: true,
    display_order: 5
  },
  {
    id: 'port-i-6',
    committee_id: '22222222-2222-2222-2222-222222222222',
    name: 'Gujarat Titans Operations',
    description: 'Unorthodox leadership, match-winning finishers, and modern tactical efficiency.',
    short_description: 'New-Era Championship Contender',
    capacity: 5,
    is_active: true,
    display_order: 6
  },

  // Lok Sabha
  {
    id: 'port-l-1',
    committee_id: '33333333-3333-3333-3333-333333333333',
    name: 'Minister of Home Affairs',
    description: 'Oversees internal security, legislative order, federal policing, and state relations.',
    short_description: 'Union Cabinet Security Portfolio',
    capacity: 10,
    is_active: true,
    display_order: 1
  },
  {
    id: 'port-l-2',
    committee_id: '33333333-3333-3333-3333-333333333333',
    name: 'Minister of Finance',
    description: 'Commands the sovereign budget, fiscal reform, taxation, and macroeconomic policy.',
    short_description: 'Fiscal & Sovereign Economy Portfolio',
    capacity: 10,
    is_active: true,
    display_order: 2
  },
  {
    id: 'port-l-3',
    committee_id: '33333333-3333-3333-3333-333333333333',
    name: 'Leader of the Opposition',
    description: 'Holding the executive accountable, building opposition consensus, and staging national walkouts.',
    short_description: 'Shadow Leader of the House',
    capacity: 10,
    is_active: true,
    display_order: 3
  },
  {
    id: 'port-l-4',
    committee_id: '33333333-3333-3333-3333-333333333333',
    name: 'Speaker of the Lok Sabha',
    description: 'Neutral custodian of parliamentary decorum, bill voting procedures, and member disciplinary orders.',
    short_description: 'Presiding Officer of Parliament',
    capacity: 5,
    is_active: true,
    display_order: 4
  },
  {
    id: 'port-l-5',
    committee_id: '33333333-3333-3333-3333-333333333333',
    name: 'Minister of External Affairs',
    description: 'Navigating geopolitical treaties, border sovereignty, and bilateral strategic diplomacy.',
    short_description: 'Foreign & Strategic Affairs',
    capacity: 10,
    is_active: true,
    display_order: 5
  },
  {
    id: 'port-l-6',
    committee_id: '33333333-3333-3333-3333-333333333333',
    name: 'Key Coalition Kingmaker MP',
    description: 'Crucial swing votes, bargaining for state infrastructure packages, and testing confidence motions.',
    short_description: 'Regional Powerbroker',
    capacity: 10,
    is_active: true,
    display_order: 6
  }
];

const defaultAppSettings: AppSettings = {
  name: 'VISTA PRESENTS: THE VERDICT',
  dates: '16–17 October',
  venue: 'APJ Block, NMAMIT',
  registration_open: true,
  upi_id: 'vista.verdict@oksbi',
  qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dvista.verdict%40oksbi%26pn%3DVISTA%2520PRESENTS%2520THE%2520VERDICT%26cu%3DINR',
  support_contact: 'verdict.vista@nmamit.ac.in',
  whatsapp_configured: false,
  email_configured: false
};

// Seed demo users and realistic registrations for immediate testing
const defaultUsers: UserProfile[] = [
  {
    id: 'usr-admin-01',
    auth_user_id: 'auth-admin-01',
    full_name: 'Commandant Admin',
    email: 'admin.verdict@nmamit.ac.in',
    role: 'admin',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'usr-part-01',
    auth_user_id: 'auth-part-01',
    full_name: 'Aditya Shenoy',
    email: 'aditya.shenoy@example.com',
    role: 'participant',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'usr-part-02',
    auth_user_id: 'auth-part-02',
    full_name: 'Pooja Hegde',
    email: 'pooja.hegde@example.com',
    role: 'participant',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Seed Registrations: Bollywood confirmed, IPL verification pending
const defaultRegistrations: Registration[] = [
  {
    id: 'reg-demo-01',
    registration_number: 'THEV-00101',
    auth_user_id: 'auth-part-01',
    committee_id: '11111111-1111-1111-1111-111111111111', // Bollywood
    registration_type: 'INDIVIDUAL',
    status: 'CONFIRMED',
    contact_email: 'aditya.events@nmamit.in',
    preferences_locked: true,
    assignment_status: 'ASSIGNED',
    reveal_status: 'REVEALED',
    confirmed_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'reg-demo-02',
    registration_number: 'THEV-IPL-00101',
    auth_user_id: 'auth-part-02',
    committee_id: '22222222-2222-2222-2222-222222222222', // IPL
    registration_type: 'TEAM',
    status: 'VERIFICATION_PENDING',
    contact_email: 'pooja.ipl@nmamit.in',
    preferences_locked: true,
    assignment_status: 'UNASSIGNED',
    reveal_status: 'HIDDEN',
    confirmed_at: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const defaultIndividualParticipants: IndividualParticipant[] = [
  {
    id: 'ind-demo-01',
    registration_id: 'reg-demo-01',
    full_name: 'Aditya Shenoy',
    usn: '4NM22IS015',
    email: 'aditya.events@nmamit.in',
    branch: 'Information Science & Engineering',
    year: '3rd Year',
    is_primary: true
  }
];

const defaultTeams: Team[] = [
  {
    id: 'team-demo-01',
    registration_id: 'reg-demo-02',
    team_name: 'Deccan Tacticians',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const defaultTeamMembers: TeamMember[] = [
  {
    id: 'tm-demo-01',
    team_id: 'team-demo-01',
    full_name: 'Pooja Hegde',
    usn: '4NM22CS089',
    email: 'pooja.ipl@nmamit.in',
    branch: 'Computer Science & Engineering',
    year: '3rd Year',
    is_leader: true
  },
  {
    id: 'tm-demo-02',
    team_id: 'team-demo-01',
    full_name: 'Rohan Pai',
    usn: '4NM22CS102',
    email: 'rohan.pai@nmamit.in',
    branch: 'Computer Science & Engineering',
    year: '3rd Year',
    is_leader: false
  },
  {
    id: 'tm-demo-03',
    team_id: 'team-demo-01',
    full_name: 'Sneha Kamath',
    usn: '4NM22IS044',
    email: 'sneha.kamath@nmamit.in',
    branch: 'Information Science & Engineering',
    year: '3rd Year',
    is_leader: false
  }
];

const defaultPreferences: Preference[] = [
  // Demo 1 Bollywood choices
  {
    id: 'pref-demo-01',
    registration_id: 'reg-demo-01',
    portfolio_id: 'port-b-1',
    rank: 1,
    locked_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'pref-demo-02',
    registration_id: 'reg-demo-01',
    portfolio_id: 'port-b-2',
    rank: 2,
    locked_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'pref-demo-03',
    registration_id: 'reg-demo-01',
    portfolio_id: 'port-b-3',
    rank: 3,
    locked_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  // Demo 2 IPL team choices
  {
    id: 'pref-demo-04',
    registration_id: 'reg-demo-02',
    portfolio_id: 'port-i-1',
    rank: 1,
    locked_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'pref-demo-05',
    registration_id: 'reg-demo-02',
    portfolio_id: 'port-i-2',
    rank: 2,
    locked_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'pref-demo-06',
    registration_id: 'reg-demo-02',
    portfolio_id: 'port-i-4',
    rank: 3,
    locked_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

const defaultPayments: Payment[] = [
  {
    id: 'pay-demo-01',
    registration_id: 'reg-demo-01',
    amount: 250,
    currency: 'INR',
    pricing_rule_id: 'p-rule-101',
    pricing_category: 'ISE',
    utr: 'UTR992819283011',
    screenshot_path: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    status: 'VERIFIED',
    submitted_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    verified_at: new Date(Date.now() - 86400000).toISOString(),
    verified_by: 'auth-admin-01'
  },
  {
    id: 'pay-demo-02',
    registration_id: 'reg-demo-02',
    amount: 750,
    currency: 'INR',
    pricing_rule_id: 'p-rule-202',
    pricing_category: 'NON_ISE',
    utr: 'UTR481920392811',
    screenshot_path: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    status: 'SUBMITTED',
    submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    verified_at: null
  }
];

const defaultAssignments: Assignment[] = [
  {
    id: 'asg-demo-01',
    registration_id: 'reg-demo-01',
    portfolio_id: 'port-b-1',
    preference_rank: 1,
    assignment_type: 'AUTOMATIC',
    assignment_run_id: 'run-init-01',
    assigned_at: new Date(Date.now() - 86400000).toISOString(),
    assigned_by: 'auth-admin-01'
  }
];

const defaultReveals: Reveal[] = [
  {
    id: 'rev-demo-01',
    registration_id: 'reg-demo-01',
    mode: 'CINEMATIC',
    revealed_at: new Date(Date.now() - 86400000).toISOString(),
    revealed_by: 'auth-admin-01'
  }
];

const defaultAuditLogs: AuditLog[] = [
  {
    id: 'audit-01',
    actor_id: 'auth-admin-01',
    action: 'SYSTEM_INITIALIZED',
    entity_type: 'system',
    new_data: { status: 'READY', event: 'VISTA PRESENTS: THE VERDICT' },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'audit-02',
    actor_id: 'auth-admin-01',
    action: 'PAYMENT_VERIFIED',
    entity_type: 'payments',
    entity_id: 'pay-demo-01',
    new_data: { registration_number: 'THEV-00101', status: 'VERIFIED' },
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export class LocalSimulationStore {
  private data: DataStore;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): DataStore {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Failed to parse localStorage, resetting to initial seed', e);
      }
    }

    return {
      committees: defaultCommittees,
      pricingRules: defaultPricingRules,
      portfolios: defaultPortfolios,
      registrations: defaultRegistrations,
      individualParticipants: defaultIndividualParticipants,
      teams: defaultTeams,
      teamMembers: defaultTeamMembers,
      preferences: defaultPreferences,
      payments: defaultPayments,
      assignments: defaultAssignments,
      reveals: defaultReveals,
      assignmentRuns: [],
      auditLogs: defaultAuditLogs,
      appSettings: defaultAppSettings,
      users: defaultUsers,
      currentUser: defaultUsers[0] // Default to Admin for testing, easily switchable to participant
    };
  }

  public save(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
    }
  }

  public resetToDefault(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    this.data = this.loadFromStorage();
  }

  public getData(): DataStore {
    return this.data;
  }
}

export const mockStore = new LocalSimulationStore();
