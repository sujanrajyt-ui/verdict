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
  AuditLog, 
  AppSettings,
  UserProfile,
  FullRegistrationDetail,
  FeeCategory
} from '../types';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { mockStore } from './mockDataStore';
import { calculatePayableFee } from '../utils/pricing';

export interface SubmitRegistrationPayload {
  authUserId: string;
  contactEmail: string;
  committeeId: string;
  registrationType: 'INDIVIDUAL' | 'TEAM';
  portfolioIds: [string, string, string]; // Top 3 ranked choices
  individualData?: {
    fullName: string;
    usn: string;
    email: string;
    branch: string;
    year: string;
  };
  teamData?: {
    teamName: string;
    leader: {
      fullName: string;
      usn: string;
      email: string;
      branch: string;
      year: string;
    };
    members: Array<{
      fullName: string;
      usn: string;
      email: string;
      branch: string;
      year: string;
    }>;
  };
  paymentData: {
    utr: string;
    screenshotPath: string;
  };
}

class DataService {
  /**
   * COMMITTEES
   */
  async getCommittees(): Promise<Committee[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('committees')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    const store = mockStore.getData();
    return [...store.committees].sort((a, b) => a.display_order - b.display_order);
  }

  async getCommitteeById(id: string): Promise<Committee | null> {
    const list = await this.getCommittees();
    return list.find((c) => c.id === id) || null;
  }

  async updateCommittee(committee: Partial<Committee> & { id: string }, adminId?: string): Promise<Committee> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('committees')
        .update(committee)
        .eq('id', committee.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const store = mockStore.getData();
    const idx = store.committees.findIndex((c) => c.id === committee.id);
    if (idx === -1) throw new Error('Committee not found');
    store.committees[idx] = { ...store.committees[idx], ...committee };
    this.addAuditLog(adminId, 'UPDATE_COMMITTEE', 'committees', committee.id, null, committee);
    mockStore.save();
    return store.committees[idx];
  }

  /**
   * PRICING RULES
   */
  async getPricingRules(committeeId?: string): Promise<PricingRule[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('registration_fee_rules').select('*');
      if (committeeId) query = query.eq('committee_id', committeeId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    const store = mockStore.getData();
    if (committeeId) {
      return store.pricingRules.filter((r) => r.committee_id === committeeId);
    }
    return store.pricingRules;
  }

  async updatePricingRule(rule: Partial<PricingRule> & { id: string }, adminId?: string): Promise<PricingRule> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('registration_fee_rules')
        .update(rule)
        .eq('id', rule.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const store = mockStore.getData();
    const idx = store.pricingRules.findIndex((r) => r.id === rule.id);
    if (idx === -1) throw new Error('Pricing rule not found');
    store.pricingRules[idx] = { ...store.pricingRules[idx], ...rule };
    this.addAuditLog(adminId, 'UPDATE_PRICING_RULE', 'registration_fee_rules', rule.id, null, rule);
    mockStore.save();
    return store.pricingRules[idx];
  }

  async createPricingRule(rule: Omit<PricingRule, 'id'>, adminId?: string): Promise<PricingRule> {
    const newId = 'p-rule-' + Math.random().toString(36).substring(2, 9);
    const newRule: PricingRule = { ...rule, id: newId };
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('registration_fee_rules')
        .insert(rule)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const store = mockStore.getData();
    store.pricingRules.push(newRule);
    this.addAuditLog(adminId, 'CREATE_PRICING_RULE', 'registration_fee_rules', newId, null, newRule);
    mockStore.save();
    return newRule;
  }

  /**
   * PORTFOLIOS
   */
  async getPortfolios(committeeId?: string): Promise<Portfolio[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('portfolios').select('*').order('display_order', { ascending: true });
      if (committeeId) query = query.eq('committee_id', committeeId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    const store = mockStore.getData();
    let res = store.portfolios;
    if (committeeId) {
      res = res.filter((p) => p.committee_id === committeeId);
    }
    return [...res].sort((a, b) => a.display_order - b.display_order);
  }

  async updatePortfolio(portfolio: Partial<Portfolio> & { id: string }, adminId?: string): Promise<Portfolio> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('portfolios')
        .update(portfolio)
        .eq('id', portfolio.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const store = mockStore.getData();
    const idx = store.portfolios.findIndex((p) => p.id === portfolio.id);
    if (idx === -1) throw new Error('Portfolio not found');
    store.portfolios[idx] = { ...store.portfolios[idx], ...portfolio };
    this.addAuditLog(adminId, 'UPDATE_PORTFOLIO', 'portfolios', portfolio.id, null, portfolio);
    mockStore.save();
    return store.portfolios[idx];
  }

  async createPortfolio(portfolio: Omit<Portfolio, 'id'>, adminId?: string): Promise<Portfolio> {
    const newId = 'port-' + Math.random().toString(36).substring(2, 9);
    const newPort: Portfolio = { ...portfolio, id: newId };
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('portfolios').insert(portfolio).select().single();
      if (error) throw error;
      return data;
    }
    const store = mockStore.getData();
    store.portfolios.push(newPort);
    this.addAuditLog(adminId, 'CREATE_PORTFOLIO', 'portfolios', newId, null, newPort);
    mockStore.save();
    return newPort;
  }

  /**
   * REGISTRATION QUERYING
   */
  async getRegistrationForUser(authUserId: string): Promise<FullRegistrationDetail | null> {
    const store = mockStore.getData();
    const reg = store.registrations.find((r) => r.auth_user_id === authUserId);
    if (!reg) return null;
    return this.hydrateRegistration(reg.id);
  }

  async getRegistrationById(id: string): Promise<FullRegistrationDetail | null> {
    return this.hydrateRegistration(id);
  }

  async getAllRegistrations(): Promise<FullRegistrationDetail[]> {
    const store = mockStore.getData();
    const list: FullRegistrationDetail[] = [];
    for (const r of store.registrations) {
      const full = await this.hydrateRegistration(r.id);
      if (full) list.push(full);
    }
    return list;
  }

  private async hydrateRegistration(registrationId: string): Promise<FullRegistrationDetail | null> {
    const store = mockStore.getData();
    const registration = store.registrations.find((r) => r.id === registrationId);
    if (!registration) return null;

    const committee = store.committees.find((c) => c.id === registration.committee_id);
    const individual = store.individualParticipants.find((ip) => ip.registration_id === registration.id);
    const team = store.teams.find((t) => t.registration_id === registration.id);
    const team_members = team ? store.teamMembers.filter((tm) => tm.team_id === team.id) : [];

    const rawPrefs = store.preferences.filter((p) => p.registration_id === registration.id);
    const preferences = rawPrefs.map((p) => ({
      ...p,
      portfolio: store.portfolios.find((port) => port.id === p.portfolio_id)
    })).sort((a, b) => a.rank - b.rank);

    const payment = store.payments.find((pay) => pay.registration_id === registration.id);
    const rawAssignment = store.assignments.find((a) => a.registration_id === registration.id);
    const assignment = rawAssignment ? {
      ...rawAssignment,
      portfolio: store.portfolios.find((p) => p.id === rawAssignment.portfolio_id)
    } : undefined;

    const reveal = store.reveals.find((rev) => rev.registration_id === registration.id);

    return {
      registration,
      committee,
      individual,
      team,
      team_members,
      preferences,
      payment,
      assignment,
      reveal
    };
  }

  /**
   * SUBMIT REGISTRATION
   * Full server-side flow with pricing snapshot and unique ID sequence
   */
  async submitRegistration(payload: SubmitRegistrationPayload): Promise<FullRegistrationDetail> {
    const store = mockStore.getData();

    // 1. Capacity check
    const committee = store.committees.find((c) => c.id === payload.committeeId);
    if (!committee) throw new Error('Simulation arena not found.');
    if (!committee.is_open) throw new Error('Registration for this simulation is closed.');

    const confirmedInCommittee = store.registrations.filter(
      (r) => r.committee_id === payload.committeeId && r.status === 'CONFIRMED'
    ).length;
    if (confirmedInCommittee >= committee.capacity) {
      throw new Error('This simulation is currently SOLD OUT.');
    }

    // 2. Duplicate check for authenticated user
    const existing = store.registrations.find((r) => r.auth_user_id === payload.authUserId);
    if (existing) {
      throw new Error('You already have an active registration. Check your dashboard.');
    }

    // 3. Resolve Branch & Calculate Fee Server-Side (Never trust client fee!)
    const branchForPricing = payload.registrationType === 'INDIVIDUAL'
      ? payload.individualData?.branch || ''
      : payload.teamData?.leader.branch || '';

    const pricingRules = store.pricingRules.filter((r) => r.committee_id === committee.id);
    const feeInfo = calculatePayableFee(committee, pricingRules, branchForPricing);

    if (!feeInfo.isAvailable) {
      throw new Error('Registration pricing is currently unavailable. Please try again later.');
    }

    // 4. Generate Unique Registration Number Sequence Server-Side
    const seqNum = store.registrations.length + 102;
    const regNumber = payload.registrationType === 'TEAM'
      ? `THEV-IPL-${String(seqNum).padStart(5, '0')}`
      : `THEV-${String(seqNum).padStart(5, '0')}`;

    const regId = 'reg-' + Math.random().toString(36).substring(2, 9);

    // 5. Create Registration Record
    const newReg: Registration = {
      id: regId,
      registration_number: regNumber,
      auth_user_id: payload.authUserId,
      committee_id: payload.committeeId,
      registration_type: payload.registrationType,
      status: 'VERIFICATION_PENDING',
      contact_email: payload.contactEmail,
      preferences_locked: true, // Preferences locked upon submission
      assignment_status: 'UNASSIGNED',
      reveal_status: 'HIDDEN',
      confirmed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.registrations.push(newReg);

    // 6. Insert Individual or Team
    if (payload.registrationType === 'INDIVIDUAL' && payload.individualData) {
      const ind: IndividualParticipant = {
        id: 'ind-' + Math.random().toString(36).substring(2, 9),
        registration_id: regId,
        full_name: payload.individualData.fullName,
        usn: payload.individualData.usn.toUpperCase(),
        email: payload.individualData.email,
        branch: payload.individualData.branch,
        year: payload.individualData.year,
        is_primary: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.individualParticipants.push(ind);
    } else if (payload.registrationType === 'TEAM' && payload.teamData) {
      // Validate team size 2 to 3
      const totalMembers = 1 + (payload.teamData.members?.length || 0);
      if (totalMembers < 2 || totalMembers > 3) {
        throw new Error('IPL team registration requires 2 to 3 members.');
      }

      const teamId = 'team-' + Math.random().toString(36).substring(2, 9);
      const newTeam: Team = {
        id: teamId,
        registration_id: regId,
        team_name: payload.teamData.teamName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.teams.push(newTeam);

      // Leader
      store.teamMembers.push({
        id: 'tm-' + Math.random().toString(36).substring(2, 9),
        team_id: teamId,
        full_name: payload.teamData.leader.fullName,
        usn: payload.teamData.leader.usn.toUpperCase(),
        email: payload.teamData.leader.email,
        branch: payload.teamData.leader.branch,
        year: payload.teamData.leader.year,
        is_leader: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Members
      payload.teamData.members.forEach((m) => {
        store.teamMembers.push({
          id: 'tm-' + Math.random().toString(36).substring(2, 9),
          team_id: teamId,
          full_name: m.fullName,
          usn: m.usn.toUpperCase(),
          email: m.email,
          branch: m.branch,
          year: m.year,
          is_leader: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    }

    // 7. Insert 3 Distinct Preferences
    payload.portfolioIds.forEach((portId, index) => {
      store.preferences.push({
        id: 'pref-' + Math.random().toString(36).substring(2, 9),
        registration_id: regId,
        portfolio_id: portId,
        rank: (index + 1) as 1 | 2 | 3,
        locked_at: new Date().toISOString(),
      });
    });

    // 8. Insert Payment with Pricing Snapshot
    const paymentId = 'pay-' + Math.random().toString(36).substring(2, 9);
    const payment: Payment = {
      id: paymentId,
      registration_id: regId,
      amount: feeInfo.amount,
      currency: 'INR',
      pricing_rule_id: feeInfo.ruleId,
      pricing_category: feeInfo.category,
      original_amount: feeInfo.amount,
      utr: payload.paymentData.utr.trim().toUpperCase(),
      screenshot_path: payload.paymentData.screenshotPath,
      status: 'SUBMITTED',
      submitted_at: new Date().toISOString(),
      verified_at: null,
    };
    store.payments.push(payment);

    // 9. Audit Log
    this.addAuditLog(payload.authUserId, 'REGISTRATION_SUBMITTED', 'registrations', regId, null, {
      registration_number: regNumber,
      amount: feeInfo.amount,
      category: feeInfo.category,
    });

    mockStore.save();
    const result = await this.hydrateRegistration(regId);
    if (!result) throw new Error('Registration failed to hydrate.');
    return result;
  }

  /**
   * PARTICIPANT EDITING (Before Admin Confirmation)
   */
  async updateParticipantDetails(
    registrationId: string,
    updates: {
      contactEmail?: string;
      individual?: Partial<IndividualParticipant>;
      teamName?: string;
      members?: TeamMember[];
    }
  ): Promise<FullRegistrationDetail> {
    const store = mockStore.getData();
    const reg = store.registrations.find((r) => r.id === registrationId);
    if (!reg) throw new Error('Registration not found');

    if (reg.status === 'CONFIRMED') {
      throw new Error('All registration editing is locked once confirmed by admin.');
    }

    if (updates.contactEmail) {
      reg.contact_email = updates.contactEmail;
      reg.updated_at = new Date().toISOString();
    }

    if (reg.registration_type === 'INDIVIDUAL' && updates.individual) {
      const ind = store.individualParticipants.find((ip) => ip.registration_id === registrationId);
      if (ind) {
        Object.assign(ind, updates.individual);
        ind.updated_at = new Date().toISOString();
      }
    }

    if (reg.registration_type === 'TEAM') {
      const team = store.teams.find((t) => t.registration_id === registrationId);
      if (team && updates.teamName) {
        team.team_name = updates.teamName;
        team.updated_at = new Date().toISOString();
      }
      if (team && updates.members) {
        if (updates.members.length < 2 || updates.members.length > 3) {
          throw new Error('Team must have 2 to 3 members.');
        }
        // Replace members
        store.teamMembers = store.teamMembers.filter((tm) => tm.team_id !== team.id);
        updates.members.forEach((m) => {
          store.teamMembers.push({
            ...m,
            team_id: team.id,
            id: m.id || 'tm-' + Math.random().toString(36).substring(2, 9),
            updated_at: new Date().toISOString(),
          });
        });
      }
    }

    this.addAuditLog(reg.auth_user_id, 'PARTICIPANT_INFO_UPDATED', 'registrations', reg.id, null, updates);
    mockStore.save();
    const refreshed = await this.hydrateRegistration(reg.id);
    return refreshed!;
  }

  /**
   * ADMIN PAYMENT VERIFICATION
   */
  async verifyPayment(paymentId: string, adminId?: string): Promise<FullRegistrationDetail> {
    const store = mockStore.getData();
    const payment = store.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment record not found');

    payment.status = 'VERIFIED';
    payment.verified_at = new Date().toISOString();
    payment.verified_by = adminId || 'admin';

    const reg = store.registrations.find((r) => r.id === payment.registration_id);
    if (reg) {
      reg.status = 'CONFIRMED';
      reg.confirmed_at = new Date().toISOString();
      reg.updated_at = new Date().toISOString();
    }

    this.addAuditLog(adminId, 'PAYMENT_VERIFIED', 'payments', paymentId, null, {
      registration_id: payment.registration_id,
      amount: payment.amount,
    });

    mockStore.save();
    const full = await this.hydrateRegistration(payment.registration_id);
    return full!;
  }

  async rejectPayment(paymentId: string, rejectionReason?: string, adminId?: string): Promise<FullRegistrationDetail> {
    const store = mockStore.getData();
    const payment = store.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment record not found');

    payment.status = 'REJECTED';
    payment.rejected_at = new Date().toISOString();
    payment.rejection_reason = rejectionReason || 'Payment verification failed.';

    const reg = store.registrations.find((r) => r.id === payment.registration_id);
    if (reg) {
      reg.status = 'RESUBMISSION_REQUIRED';
      reg.updated_at = new Date().toISOString();
    }

    this.addAuditLog(adminId, 'PAYMENT_REJECTED', 'payments', paymentId, null, {
      registration_id: payment.registration_id,
      reason: rejectionReason,
    });

    mockStore.save();
    const full = await this.hydrateRegistration(payment.registration_id);
    return full!;
  }

  async resubmitPayment(paymentId: string, newUtr: string, newScreenshotPath: string): Promise<Payment> {
    const store = mockStore.getData();
    const payment = store.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment record not found');

    payment.utr = newUtr.trim().toUpperCase();
    payment.screenshot_path = newScreenshotPath;
    payment.status = 'SUBMITTED';
    payment.submitted_at = new Date().toISOString();
    payment.rejected_at = null;
    payment.rejection_reason = null;

    const reg = store.registrations.find((r) => r.id === payment.registration_id);
    if (reg) {
      reg.status = 'VERIFICATION_PENDING';
      reg.updated_at = new Date().toISOString();
    }

    this.addAuditLog(reg?.auth_user_id, 'PAYMENT_RESUBMITTED', 'payments', paymentId, null, {
      utr: newUtr,
    });

    mockStore.save();
    return payment;
  }

  async overridePaymentAmount(
    paymentId: string, 
    overrideAmount: number, 
    reason: string, 
    adminId?: string
  ): Promise<Payment> {
    const store = mockStore.getData();
    const payment = store.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment record not found');

    payment.override_amount = overrideAmount;
    payment.override_reason = reason;
    payment.overridden_by = adminId || 'admin';
    payment.overridden_at = new Date().toISOString();
    payment.amount = overrideAmount;

    this.addAuditLog(adminId, 'PAYMENT_AMOUNT_OVERRIDDEN', 'payments', paymentId, null, {
      original: payment.original_amount,
      override: overrideAmount,
      reason,
    });

    mockStore.save();
    return payment;
  }

  /**
   * PORTFOLIO ASSIGNMENT ENGINE
   */
  async runAutoAssignment(
    committeeId: string, 
    mode: 'AUTO_BALANCED' | 'MANUAL_CAPACITY' = 'AUTO_BALANCED', 
    adminId?: string
  ): Promise<{ assignedCount: number; runId: string }> {
    const store = mockStore.getData();

    // Find confirmed, unassigned registrations for this committee
    const eligibleRegs = store.registrations.filter(
      (r) => r.committee_id === committeeId && r.status === 'CONFIRMED' && r.assignment_status === 'UNASSIGNED'
    );

    // Fair randomized draw
    const shuffled = [...eligibleRegs].sort(() => Math.random() - 0.5);

    const runId = 'run-' + Math.random().toString(36).substring(2, 9);
    store.assignmentRuns.push({
      id: runId,
      committee_id: committeeId,
      run_type: mode,
      created_by: adminId || 'admin',
      created_at: new Date().toISOString(),
      metadata: { eligibleCount: eligibleRegs.length }
    });

    const activePortfolios = store.portfolios.filter((p) => p.committee_id === committeeId && p.is_active);
    let assignedCount = 0;

    for (const reg of shuffled) {
      const prefs = store.preferences
        .filter((p) => p.registration_id === reg.id)
        .sort((a, b) => a.rank - b.rank);

      let assigned = false;

      // Check Rank 1, 2, 3
      for (const pref of prefs) {
        const port = activePortfolios.find((p) => p.id === pref.portfolio_id);
        if (!port) continue;

        const currentAssigned = store.assignments.filter((a) => a.portfolio_id === port.id).length;
        if (currentAssigned < port.capacity) {
          store.assignments.push({
            id: 'asg-' + Math.random().toString(36).substring(2, 9),
            registration_id: reg.id,
            portfolio_id: port.id,
            preference_rank: pref.rank,
            assignment_type: 'AUTOMATIC',
            assignment_run_id: runId,
            assigned_at: new Date().toISOString(),
            assigned_by: adminId || 'admin',
          });

          reg.assignment_status = 'ASSIGNED';
          reg.updated_at = new Date().toISOString();
          assigned = true;
          assignedCount++;
          break;
        }
      }

      // Fallback: If 1, 2, 3 full, place in any portfolio with capacity
      if (!assigned) {
        for (const port of activePortfolios) {
          const currentAssigned = store.assignments.filter((a) => a.portfolio_id === port.id).length;
          if (currentAssigned < port.capacity) {
            store.assignments.push({
              id: 'asg-' + Math.random().toString(36).substring(2, 9),
              registration_id: reg.id,
              portfolio_id: port.id,
              preference_rank: null,
              assignment_type: 'AUTOMATIC',
              assignment_run_id: runId,
              assigned_at: new Date().toISOString(),
              assigned_by: adminId || 'admin',
            });

            reg.assignment_status = 'ASSIGNED';
            reg.updated_at = new Date().toISOString();
            assigned = true;
            assignedCount++;
            break;
          }
        }
      }
    }

    this.addAuditLog(adminId, 'ASSIGNMENT_RUN_COMPLETED', 'assignment_runs', runId, null, {
      committeeId,
      assignedCount,
      mode
    });

    mockStore.save();
    return { assignedCount, runId };
  }

  async manualAssignPortfolio(
    registrationId: string, 
    portfolioId: string, 
    reason: string, 
    adminId?: string
  ): Promise<Assignment> {
    const store = mockStore.getData();
    const reg = store.registrations.find((r) => r.id === registrationId);
    if (!reg) throw new Error('Registration not found');

    const port = store.portfolios.find((p) => p.id === portfolioId);
    if (!port) throw new Error('Portfolio not found');

    const existingIdx = store.assignments.findIndex((a) => a.registration_id === registrationId);
    let assignment: Assignment;

    if (existingIdx !== -1) {
      const prev = store.assignments[existingIdx];
      assignment = {
        ...prev,
        previous_portfolio_id: prev.portfolio_id,
        portfolio_id: portfolioId,
        assignment_type: 'MANUAL',
        override_reason: reason,
        assigned_by: adminId || 'admin',
        assigned_at: new Date().toISOString(),
      };
      store.assignments[existingIdx] = assignment;
    } else {
      assignment = {
        id: 'asg-' + Math.random().toString(36).substring(2, 9),
        registration_id: registrationId,
        portfolio_id: portfolioId,
        preference_rank: null,
        assignment_type: 'MANUAL',
        override_reason: reason,
        assigned_by: adminId || 'admin',
        assigned_at: new Date().toISOString(),
      };
      store.assignments.push(assignment);
    }

    reg.assignment_status = 'ASSIGNED';
    reg.updated_at = new Date().toISOString();

    this.addAuditLog(adminId, 'MANUAL_PORTFOLIO_ASSIGNED', 'assignments', assignment.id, null, {
      registrationId,
      portfolioId,
      reason
    });

    mockStore.save();
    return assignment;
  }

  async resetAssignments(committeeId: string, adminId?: string): Promise<number> {
    const store = mockStore.getData();
    const commRegs = store.registrations.filter((r) => r.committee_id === committeeId);
    const commRegIds = new Set(commRegs.map((r) => r.id));

    let removed = 0;
    store.assignments = store.assignments.filter((a) => {
      if (commRegIds.has(a.registration_id)) {
        removed++;
        return false;
      }
      return true;
    });

    // Reset registration statuses
    commRegs.forEach((r) => {
      r.assignment_status = 'UNASSIGNED';
      r.reveal_status = 'HIDDEN';
      r.updated_at = new Date().toISOString();
    });

    this.addAuditLog(adminId, 'RESET_ASSIGNMENTS', 'committees', committeeId, null, {
      clearedCount: removed
    });

    mockStore.save();
    return removed;
  }

  /**
   * REVEAL MANAGEMENT
   */
  async revealAssignment(
    registrationId: string, 
    mode: 'CINEMATIC' | 'SIMPLE' = 'CINEMATIC', 
    adminId?: string
  ): Promise<Reveal> {
    const store = mockStore.getData();
    const reg = store.registrations.find((r) => r.id === registrationId);
    if (!reg) throw new Error('Registration not found');

    const asg = store.assignments.find((a) => a.registration_id === registrationId);
    if (!asg) throw new Error('Cannot reveal portfolio: participant is not assigned yet.');

    reg.reveal_status = 'REVEALED';
    reg.updated_at = new Date().toISOString();

    let rev = store.reveals.find((rv) => rv.registration_id === registrationId);
    if (rev) {
      rev.mode = mode;
      rev.revealed_at = new Date().toISOString();
      rev.revealed_by = adminId || 'admin';
    } else {
      rev = {
        id: 'rev-' + Math.random().toString(36).substring(2, 9),
        registration_id: registrationId,
        mode,
        revealed_at: new Date().toISOString(),
        revealed_by: adminId || 'admin',
      };
      store.reveals.push(rev);
    }

    this.addAuditLog(adminId, 'PORTFOLIO_REVEALED', 'reveals', rev.id, null, {
      registrationId,
      mode
    });

    mockStore.save();
    return rev;
  }

  async revealCommittee(
    committeeId: string, 
    mode: 'CINEMATIC' | 'SIMPLE' = 'CINEMATIC', 
    adminId?: string
  ): Promise<number> {
    const store = mockStore.getData();
    const regs = store.registrations.filter(
      (r) => r.committee_id === committeeId && r.assignment_status === 'ASSIGNED'
    );

    let count = 0;
    for (const reg of regs) {
      await this.revealAssignment(reg.id, mode, adminId);
      count++;
    }

    this.addAuditLog(adminId, 'BULK_COMMITTEE_REVEALED', 'committees', committeeId, null, {
      revealedCount: count,
      mode
    });

    mockStore.save();
    return count;
  }

  /**
   * APP SETTINGS & AUDIT LOGS
   */
  async getAppSettings(): Promise<AppSettings> {
    const store = mockStore.getData();
    return store.appSettings;
  }

  async updateAppSettings(settings: Partial<AppSettings>, adminId?: string): Promise<AppSettings> {
    const store = mockStore.getData();
    store.appSettings = { ...store.appSettings, ...settings };
    this.addAuditLog(adminId, 'UPDATE_APP_SETTINGS', 'app_settings', undefined, null, settings);
    mockStore.save();
    return store.appSettings;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    const store = mockStore.getData();
    return [...store.auditLogs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  private addAuditLog(
    actorId: string | undefined, 
    action: string, 
    entityType: string, 
    entityId?: string, 
    oldData?: any, 
    newData?: any
  ): void {
    const store = mockStore.getData();
    store.auditLogs.push({
      id: 'audit-' + Math.random().toString(36).substring(2, 9),
      actor_id: actorId || null,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      old_data: oldData || null,
      new_data: newData || null,
      created_at: new Date().toISOString(),
    });
  }
}

export const dataService = new DataService();
