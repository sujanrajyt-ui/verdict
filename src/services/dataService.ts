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
  FullRegistrationDetail
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
   * STORAGE / ASSET UPLOAD
   */
  async uploadPaymentScreenshot(file: File | Blob, registrationNumber?: string): Promise<string> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const ext = 'png';
        const cleanReg = (registrationNumber || 'reg').replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `${cleanReg}_${Date.now()}.${ext}`;
        const { data, error } = await supabase.storage.from('payment-screenshots').upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });
        if (!error && data) {
          const { data: urlData } = supabase.storage.from('payment-screenshots').getPublicUrl(fileName);
          return urlData?.publicUrl || fileName;
        }
      } catch (err) {
        console.warn('Supabase storage upload error, falling back to data URL', err);
      }
    }
    // Fallback: convert to base64 Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * COMMITTEES
   */
  async getCommittees(): Promise<Committee[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('committees')
          .select('*')
          .order('display_order', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('Supabase getCommittees failed, falling back to mockStore', err);
      }
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
      try {
        const { data, error } = await supabase
          .from('committees')
          .update(committee)
          .eq('id', committee.id)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase updateCommittee failed, falling back to mockStore', err);
      }
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
      try {
        let query = supabase.from('registration_fee_rules').select('*');
        if (committeeId) {
          query = query.eq('committee_id', committeeId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('Supabase getPricingRules failed, falling back to mockStore', err);
      }
    }
    const store = mockStore.getData();
    let res = store.pricingRules;
    if (committeeId) {
      res = res.filter((r) => r.committee_id === committeeId);
    }
    return res;
  }

  async updatePricingRule(rule: Partial<PricingRule> & { id: string }, adminId?: string): Promise<PricingRule> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('registration_fee_rules')
          .update(rule)
          .eq('id', rule.id)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase updatePricingRule failed, falling back to mockStore', err);
      }
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
    const newId = 'rule-' + Math.random().toString(36).substring(2, 9);
    const newRule: PricingRule = { ...rule, id: newId };
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('registration_fee_rules')
          .insert(rule)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase createPricingRule failed, falling back to mockStore', err);
      }
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
      try {
        let query = supabase.from('portfolios').select('*');
        if (committeeId) {
          query = query.eq('committee_id', committeeId);
        }
        const { data, error } = await query.order('display_order', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('Supabase getPortfolios failed, falling back to mockStore', err);
      }
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
      try {
        const { data, error } = await supabase
          .from('portfolios')
          .update(portfolio)
          .eq('id', portfolio.id)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase updatePortfolio failed, falling back to mockStore', err);
      }
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
      try {
        const { data, error } = await supabase.from('portfolios').insert(portfolio).select().single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase createPortfolio failed, falling back to mockStore', err);
      }
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
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: reg, error } = await supabase
          .from('registrations')
          .select(`
            *,
            committee:committees(*),
            individual:individual_participants(*),
            team:teams(*, team_members(*)),
            preferences:preferences(*, portfolio:portfolios(*)),
            payment:payments(*),
            assignment:assignments(*, portfolio:portfolios(*)),
            reveal:reveals(*)
          `)
          .eq('auth_user_id', authUserId)
          .maybeSingle();

        if (!error && reg) {
          return this.mapSupabaseRegistration(reg);
        }
      } catch (err) {
        console.warn('Supabase getRegistrationForUser error, using mockStore', err);
      }
    }
    const store = mockStore.getData();
    const reg = store.registrations.find((r) => r.auth_user_id === authUserId);
    if (!reg) return null;
    return this.hydrateRegistration(reg.id);
  }

  async getRegistrationById(id: string): Promise<FullRegistrationDetail | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: reg, error } = await supabase
          .from('registrations')
          .select(`
            *,
            committee:committees(*),
            individual:individual_participants(*),
            team:teams(*, team_members(*)),
            preferences:preferences(*, portfolio:portfolios(*)),
            payment:payments(*),
            assignment:assignments(*, portfolio:portfolios(*)),
            reveal:reveals(*)
          `)
          .eq('id', id)
          .maybeSingle();

        if (!error && reg) {
          return this.mapSupabaseRegistration(reg);
        }
      } catch (err) {
        console.warn('Supabase getRegistrationById error, using mockStore', err);
      }
    }
    return this.hydrateRegistration(id);
  }

  async getAllRegistrations(): Promise<FullRegistrationDetail[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: regs, error } = await supabase
          .from('registrations')
          .select(`
            *,
            committee:committees(*),
            individual:individual_participants(*),
            team:teams(*, team_members(*)),
            preferences:preferences(*, portfolio:portfolios(*)),
            payment:payments(*),
            assignment:assignments(*, portfolio:portfolios(*)),
            reveal:reveals(*)
          `)
          .order('created_at', { ascending: false });

        if (!error && regs && regs.length > 0) {
          return regs.map((r: any) => this.mapSupabaseRegistration(r));
        }
      } catch (err) {
        console.warn('Supabase getAllRegistrations error, using mockStore', err);
      }
    }
    const store = mockStore.getData();
    const list: FullRegistrationDetail[] = [];
    for (const r of store.registrations) {
      const full = await this.hydrateRegistration(r.id);
      if (full) list.push(full);
    }
    return list;
  }

  private mapSupabaseRegistration(r: any): FullRegistrationDetail {
    const individual = Array.isArray(r.individual) ? r.individual[0] : r.individual;
    const team = Array.isArray(r.team) ? r.team[0] : r.team;
    const team_members = Array.isArray(r.team) && r.team[0]?.team_members 
      ? r.team[0].team_members 
      : (team?.team_members || []);
    const preferences = (r.preferences || [])
      .map((p: any) => ({
        ...p,
        portfolio: Array.isArray(p.portfolio) ? p.portfolio[0] : p.portfolio
      }))
      .sort((a: any, b: any) => a.rank - b.rank);
    const payment = Array.isArray(r.payment) ? r.payment[0] : r.payment;
    const rawAssignment = Array.isArray(r.assignment) ? r.assignment[0] : r.assignment;
    const assignment = rawAssignment ? {
      ...rawAssignment,
      portfolio: Array.isArray(rawAssignment.portfolio) ? rawAssignment.portfolio[0] : rawAssignment.portfolio
    } : undefined;
    const reveal = Array.isArray(r.reveal) ? r.reveal[0] : r.reveal;

    return {
      registration: {
        id: r.id,
        registration_number: r.registration_number,
        auth_user_id: r.auth_user_id,
        committee_id: r.committee_id,
        registration_type: r.registration_type,
        status: r.status,
        contact_email: r.contact_email,
        preferences_locked: r.preferences_locked,
        assignment_status: r.assignment_status,
        reveal_status: r.reveal_status,
        confirmed_at: r.confirmed_at,
        created_at: r.created_at,
        updated_at: r.updated_at,
      },
      committee: Array.isArray(r.committee) ? r.committee[0] : r.committee,
      individual,
      team,
      team_members,
      preferences,
      payment,
      assignment,
      reveal
    };
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
    // 1. Production Supabase Path (if live credentials connected)
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: committee } = await supabase
          .from('committees')
          .select('*')
          .eq('id', payload.committeeId)
          .single();
        if (!committee) throw new Error('Simulation arena not found.');
        if (!committee.is_open) throw new Error('Registration for this simulation is closed.');

        const { count: confirmedCount } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('committee_id', payload.committeeId)
          .eq('status', 'CONFIRMED');
        if (confirmedCount && confirmedCount >= committee.capacity) {
          throw new Error('This simulation is currently SOLD OUT.');
        }

        const { data: existing } = await supabase
          .from('registrations')
          .select('id')
          .eq('auth_user_id', payload.authUserId)
          .maybeSingle();
        if (existing) {
          throw new Error('You already have an active registration. Check your dashboard.');
        }

        const branchForPricing = payload.registrationType === 'INDIVIDUAL'
          ? payload.individualData?.branch || ''
          : payload.teamData?.leader.branch || '';

        const { data: rules } = await supabase
          .from('registration_fee_rules')
          .select('*')
          .eq('committee_id', payload.committeeId);

        const feeInfo = calculatePayableFee(committee, rules || [], branchForPricing);
        if (!feeInfo.isAvailable) {
          throw new Error('Registration pricing is currently unavailable. Please try again later.');
        }

        let regNumber = '';
        try {
          const { data: rpcNum } = await supabase.rpc('generate_registration_number', {
            p_format: payload.registrationType,
          });
          if (rpcNum) regNumber = rpcNum;
        } catch {
          // Fallback to count sequence
        }

        if (!regNumber) {
          const { count: totalRegs } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true });
          const seqNum = (totalRegs || 0) + 102;
          regNumber = payload.registrationType === 'TEAM'
            ? `THEV-IPL-${String(seqNum).padStart(5, '0')}`
            : `THEV-${String(seqNum).padStart(5, '0')}`;
        }

        const { data: newReg, error: regErr } = await supabase
          .from('registrations')
          .insert({
            registration_number: regNumber,
            auth_user_id: payload.authUserId,
            committee_id: payload.committeeId,
            registration_type: payload.registrationType,
            status: 'VERIFICATION_PENDING',
            contact_email: payload.contactEmail,
            preferences_locked: true,
            assignment_status: 'UNASSIGNED',
            reveal_status: 'HIDDEN',
          })
          .select()
          .single();

        if (regErr || !newReg) throw regErr || new Error('Failed to create registration record');

        if (payload.registrationType === 'INDIVIDUAL' && payload.individualData) {
          await supabase.from('individual_participants').insert({
            registration_id: newReg.id,
            full_name: payload.individualData.fullName,
            usn: payload.individualData.usn.toUpperCase(),
            email: payload.individualData.email,
            branch: payload.individualData.branch,
            year: payload.individualData.year,
            is_primary: true,
          });
        } else if (payload.registrationType === 'TEAM' && payload.teamData) {
          const { data: newTeam } = await supabase
            .from('teams')
            .insert({
              registration_id: newReg.id,
              team_name: payload.teamData.teamName,
            })
            .select()
            .single();

          if (newTeam) {
            await supabase.from('team_members').insert({
              team_id: newTeam.id,
              full_name: payload.teamData.leader.fullName,
              usn: payload.teamData.leader.usn.toUpperCase(),
              email: payload.teamData.leader.email,
              branch: payload.teamData.leader.branch,
              year: payload.teamData.leader.year,
              is_leader: true,
            });

            for (const m of payload.teamData.members) {
              await supabase.from('team_members').insert({
                team_id: newTeam.id,
                full_name: m.fullName,
                usn: m.usn.toUpperCase(),
                email: m.email,
                branch: m.branch,
                year: m.year,
                is_leader: false,
              });
            }
          }
        }

        const prefRows = payload.portfolioIds.map((portId, index) => ({
          registration_id: newReg.id,
          portfolio_id: portId,
          rank: index + 1,
          locked_at: new Date().toISOString(),
        }));
        await supabase.from('preferences').insert(prefRows);

        await supabase.from('payments').insert({
          registration_id: newReg.id,
          amount: feeInfo.amount,
          currency: 'INR',
          pricing_rule_id: feeInfo.ruleId || null,
          pricing_category: feeInfo.category,
          original_amount: feeInfo.amount,
          utr: payload.paymentData.utr.trim().toUpperCase(),
          screenshot_path: payload.paymentData.screenshotPath,
          status: 'SUBMITTED',
          submitted_at: new Date().toISOString(),
        });

        await supabase.from('audit_logs').insert({
          actor_id: payload.authUserId,
          action: 'REGISTRATION_SUBMITTED',
          entity_type: 'registrations',
          entity_id: newReg.id,
          new_data: {
            registration_number: regNumber,
            amount: feeInfo.amount,
            category: feeInfo.category,
          },
        });

        const result = await this.getRegistrationById(newReg.id);
        if (result) return result;
      } catch (supabaseErr) {
        console.warn('Supabase submitRegistration failed, falling back to local simulation store', supabaseErr);
      }
    }

    // 2. Simulation / Fallback Local Store Path
    const store = mockStore.getData();

    const committee = store.committees.find((c) => c.id === payload.committeeId);
    if (!committee) throw new Error('Simulation arena not found.');
    if (!committee.is_open) throw new Error('Registration for this simulation is closed.');

    const confirmedInCommittee = store.registrations.filter(
      (r) => r.committee_id === payload.committeeId && r.status === 'CONFIRMED'
    ).length;
    if (confirmedInCommittee >= committee.capacity) {
      throw new Error('This simulation is currently SOLD OUT.');
    }

    const existing = store.registrations.find((r) => r.auth_user_id === payload.authUserId);
    if (existing) {
      throw new Error('You already have an active registration. Check your dashboard.');
    }

    const branchForPricing = payload.registrationType === 'INDIVIDUAL'
      ? payload.individualData?.branch || ''
      : payload.teamData?.leader.branch || '';

    const pricingRules = store.pricingRules.filter((r) => r.committee_id === committee.id);
    const feeInfo = calculatePayableFee(committee, pricingRules, branchForPricing);

    if (!feeInfo.isAvailable) {
      throw new Error('Registration pricing is currently unavailable. Please try again later.');
    }

    const seqNum = store.registrations.length + 102;
    const regNumber = payload.registrationType === 'TEAM'
      ? `THEV-IPL-${String(seqNum).padStart(5, '0')}`
      : `THEV-${String(seqNum).padStart(5, '0')}`;

    const regId = 'reg-' + Math.random().toString(36).substring(2, 9);

    const newReg: Registration = {
      id: regId,
      registration_number: regNumber,
      auth_user_id: payload.authUserId,
      committee_id: payload.committeeId,
      registration_type: payload.registrationType,
      status: 'VERIFICATION_PENDING',
      contact_email: payload.contactEmail,
      preferences_locked: true,
      assignment_status: 'UNASSIGNED',
      reveal_status: 'HIDDEN',
      confirmed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.registrations.push(newReg);

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

    payload.portfolioIds.forEach((portId, index) => {
      store.preferences.push({
        id: 'pref-' + Math.random().toString(36).substring(2, 9),
        registration_id: regId,
        portfolio_id: portId,
        rank: (index + 1) as 1 | 2 | 3,
        locked_at: new Date().toISOString(),
      });
    });

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
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: reg } = await supabase.from('registrations').select('*').eq('id', registrationId).single();
        if (reg) {
          if (reg.status === 'CONFIRMED') {
            throw new Error('All registration editing is locked once confirmed by admin.');
          }

          if (updates.contactEmail) {
            await supabase.from('registrations').update({
              contact_email: updates.contactEmail,
              updated_at: new Date().toISOString(),
            }).eq('id', registrationId);
          }

          if (reg.registration_type === 'INDIVIDUAL' && updates.individual) {
            await supabase.from('individual_participants').update({
              ...updates.individual,
              updated_at: new Date().toISOString(),
            }).eq('registration_id', registrationId);
          }

          if (reg.registration_type === 'TEAM') {
            const { data: team } = await supabase.from('teams').select('id').eq('registration_id', registrationId).single();
            if (team && updates.teamName) {
              await supabase.from('teams').update({
                team_name: updates.teamName,
                updated_at: new Date().toISOString(),
              }).eq('id', team.id);
            }
            if (team && updates.members) {
              await supabase.from('team_members').delete().eq('team_id', team.id);
              for (const m of updates.members) {
                await supabase.from('team_members').insert({
                  team_id: team.id,
                  full_name: m.full_name,
                  usn: m.usn.toUpperCase(),
                  email: m.email,
                  branch: m.branch,
                  year: m.year,
                  is_leader: m.is_leader,
                });
              }
            }
          }

          await supabase.from('audit_logs').insert({
            actor_id: reg.auth_user_id,
            action: 'PARTICIPANT_INFO_UPDATED',
            entity_type: 'registrations',
            entity_id: registrationId,
            new_data: updates,
          });

          const refreshed = await this.getRegistrationById(registrationId);
          if (refreshed) return refreshed;
        }
      } catch (err) {
        console.warn('Supabase updateParticipantDetails failed, falling back to mock store', err);
      }
    }

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
    if (isSupabaseConfigured() && supabase) {
      try {
        const now = new Date().toISOString();
        await supabase.from('payments').update({
          status: 'VERIFIED',
          verified_at: now,
          verified_by: adminId || 'admin',
        }).eq('id', paymentId);

        const { data: pay } = await supabase.from('payments').select('registration_id, amount').eq('id', paymentId).single();
        if (pay?.registration_id) {
          await supabase.from('registrations').update({
            status: 'CONFIRMED',
            confirmed_at: now,
            updated_at: now,
          }).eq('id', pay.registration_id);

          await supabase.from('audit_logs').insert({
            actor_id: adminId || null,
            action: 'PAYMENT_VERIFIED',
            entity_type: 'payments',
            entity_id: paymentId,
            new_data: { registration_id: pay.registration_id, amount: pay.amount },
          });

          const full = await this.getRegistrationById(pay.registration_id);
          if (full) return full;
        }
      } catch (err) {
        console.warn('Supabase verifyPayment failed, falling back to mock store', err);
      }
    }

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
    if (isSupabaseConfigured() && supabase) {
      try {
        const now = new Date().toISOString();
        await supabase.from('payments').update({
          status: 'REJECTED',
          rejected_at: now,
          rejection_reason: rejectionReason || 'Payment verification failed.',
        }).eq('id', paymentId);

        const { data: pay } = await supabase.from('payments').select('registration_id').eq('id', paymentId).single();
        if (pay?.registration_id) {
          await supabase.from('registrations').update({
            status: 'RESUBMISSION_REQUIRED',
            updated_at: now,
          }).eq('id', pay.registration_id);

          await supabase.from('audit_logs').insert({
            actor_id: adminId || null,
            action: 'PAYMENT_REJECTED',
            entity_type: 'payments',
            entity_id: paymentId,
            new_data: { registration_id: pay.registration_id, reason: rejectionReason },
          });

          const full = await this.getRegistrationById(pay.registration_id);
          if (full) return full;
        }
      } catch (err) {
        console.warn('Supabase rejectPayment failed, falling back to mock store', err);
      }
    }

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
    if (isSupabaseConfigured() && supabase) {
      try {
        const now = new Date().toISOString();
        const { data: pay, error: payErr } = await supabase.from('payments').update({
          utr: newUtr.trim().toUpperCase(),
          screenshot_path: newScreenshotPath,
          status: 'SUBMITTED',
          submitted_at: now,
          rejected_at: null,
          rejection_reason: null,
        }).eq('id', paymentId).select().single();

        if (!payErr && pay) {
          await supabase.from('registrations').update({
            status: 'VERIFICATION_PENDING',
            updated_at: now,
          }).eq('id', pay.registration_id);

          await supabase.from('audit_logs').insert({
            actor_id: null,
            action: 'PAYMENT_RESUBMITTED',
            entity_type: 'payments',
            entity_id: paymentId,
            new_data: { utr: newUtr },
          });
          return pay;
        }
      } catch (err) {
        console.warn('Supabase resubmitPayment failed, falling back to mock store', err);
      }
    }

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
    if (isSupabaseConfigured() && supabase) {
      try {
        const now = new Date().toISOString();
        const { data: pay, error } = await supabase.from('payments').update({
          amount: overrideAmount,
          override_amount: overrideAmount,
          override_reason: reason,
          overridden_by: adminId || 'admin',
          overridden_at: now,
        }).eq('id', paymentId).select().single();

        if (!error && pay) {
          await supabase.from('audit_logs').insert({
            actor_id: adminId || null,
            action: 'PAYMENT_AMOUNT_OVERRIDDEN',
            entity_type: 'payments',
            entity_id: paymentId,
            new_data: { override_amount: overrideAmount, reason },
          });
          return pay;
        }
      } catch (err) {
        console.warn('Supabase overridePaymentAmount failed, falling back to mock store', err);
      }
    }

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
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.rpc('run_portfolio_assignment', {
          p_committee_id: committeeId,
          p_mode: mode,
          p_admin_id: adminId || 'admin',
        });
        if (!error && data) {
          return {
            assignedCount: data.assigned_count || 0,
            runId: data.run_id || ('run-' + Date.now()),
          };
        }
      } catch (err) {
        console.warn('Supabase RPC run_portfolio_assignment failed, falling back to mock assignment', err);
      }
    }

    const store = mockStore.getData();

    const eligibleRegs = store.registrations.filter(
      (r) => r.committee_id === committeeId && r.status === 'CONFIRMED' && r.assignment_status === 'UNASSIGNED'
    );

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
    if (isSupabaseConfigured() && supabase) {
      try {
        const now = new Date().toISOString();
        const { data: asg, error } = await supabase.from('assignments').upsert({
          registration_id: registrationId,
          portfolio_id: portfolioId,
          assignment_source: 'MANUAL',
          preference_matched: null,
          override_reason: reason,
          assigned_by: adminId || 'admin',
          assigned_at: now,
        }, { onConflict: 'registration_id' }).select().single();

        if (!error && asg) {
          await supabase.from('registrations').update({
            assignment_status: 'ASSIGNED',
            updated_at: now,
          }).eq('id', registrationId);

          await supabase.from('audit_logs').insert({
            actor_id: adminId || null,
            action: 'MANUAL_PORTFOLIO_ASSIGNED',
            entity_type: 'assignments',
            entity_id: registrationId,
            new_data: { portfolio_id: portfolioId, reason },
          });

          return asg;
        }
      } catch (err) {
        console.warn('Supabase manualAssignPortfolio failed, falling back to mock store', err);
      }
    }

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
      reason,
    });

    mockStore.save();
    return assignment;
  }

  async resetPortfolioAssignments(committeeId: string, adminId?: string): Promise<number> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: regs } = await supabase
          .from('registrations')
          .select('id')
          .eq('committee_id', committeeId);

        const regIds = (regs || []).map((r: any) => r.id);
        if (regIds.length > 0) {
          await supabase.from('assignments').delete().in('registration_id', regIds);
          await supabase.from('registrations').update({
            assignment_status: 'UNASSIGNED',
            reveal_status: 'HIDDEN',
            updated_at: new Date().toISOString(),
          }).in('id', regIds);

          await supabase.from('audit_logs').insert({
            actor_id: adminId || null,
            action: 'RESET_ASSIGNMENTS',
            entity_type: 'committees',
            entity_id: committeeId,
            new_data: { clearedCount: regIds.length },
          });

          return regIds.length;
        }
      } catch (err) {
        console.warn('Supabase resetPortfolioAssignments failed, falling back to mock store', err);
      }
    }

    const store = mockStore.getData();
    const commRegs = store.registrations.filter((r) => r.committee_id === committeeId);
    const regIds = commRegs.map((r) => r.id);

    const initialCount = store.assignments.length;
    store.assignments = store.assignments.filter((a) => !regIds.includes(a.registration_id));
    const removed = initialCount - store.assignments.length;

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

  async resetAssignments(committeeId: string, adminId?: string): Promise<number> {
    return this.resetPortfolioAssignments(committeeId, adminId);
  }

  /**
   * REVEAL MANAGEMENT
   */
  async revealAssignment(
    registrationId: string, 
    mode: 'CINEMATIC' | 'SIMPLE' = 'CINEMATIC', 
    adminId?: string
  ): Promise<Reveal> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const now = new Date().toISOString();
        const { data: rev, error } = await supabase.from('reveals').upsert({
          registration_id: registrationId,
          mode,
          revealed_at: now,
          revealed_by: adminId || 'admin',
        }, { onConflict: 'registration_id' }).select().single();

        if (!error && rev) {
          await supabase.from('registrations').update({
            reveal_status: 'REVEALED',
            updated_at: now,
          }).eq('id', registrationId);

          await supabase.from('audit_logs').insert({
            actor_id: adminId || null,
            action: 'PORTFOLIO_REVEALED',
            entity_type: 'reveals',
            entity_id: rev.id,
            new_data: { registrationId, mode },
          });

          return rev;
        }
      } catch (err) {
        console.warn('Supabase revealAssignment failed, falling back to mock store', err);
      }
    }

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
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'event_info')
          .maybeSingle();

        if (data?.value) {
          return data.value;
        }
      } catch (err) {
        console.warn('Supabase getAppSettings failed, falling back to mock store', err);
      }
    }
    const store = mockStore.getData();
    return store.appSettings;
  }

  async updateAppSettings(settings: Partial<AppSettings>, adminId?: string): Promise<AppSettings> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const current = await this.getAppSettings();
        const merged = { ...current, ...settings };
        const { data, error } = await supabase
          .from('app_settings')
          .upsert({
            key: 'event_info',
            value: merged,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'key' })
          .select()
          .single();

        if (!error && data?.value) {
          await supabase.from('audit_logs').insert({
            actor_id: adminId || null,
            action: 'UPDATE_APP_SETTINGS',
            entity_type: 'app_settings',
            new_data: settings,
          });
          return data.value;
        }
      } catch (err) {
        console.warn('Supabase updateAppSettings failed, falling back to mock store', err);
      }
    }

    const store = mockStore.getData();
    store.appSettings = { ...store.appSettings, ...settings };
    this.addAuditLog(adminId, 'UPDATE_APP_SETTINGS', 'app_settings', undefined, null, settings);
    mockStore.save();
    return store.appSettings;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase getAuditLogs failed, falling back to mock store', err);
      }
    }

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
