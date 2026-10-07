-- ============================================================================
-- VISTA PRESENTS: THE VERDICT
-- PRODUCTION SUPABASE POSTGRESQL DATABASE SCHEMA & MIGRATION SCRIPT
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing schema if reinstalling
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS reveals CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS assignment_runs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS preferences CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS individual_participants CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS registration_fee_rules CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS committees CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;

DROP SEQUENCE IF EXISTS individual_reg_seq;
DROP SEQUENCE IF EXISTS ipl_reg_seq;

-- Sequences for server-side unique registration numbers
CREATE SEQUENCE individual_reg_seq START WITH 101;
CREATE SEQUENCE ipl_reg_seq START WITH 101;

-- ============================================================================
-- 1. PROFILES & ROLES
-- ============================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    auth_user_id UUID UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. COMMITTEES (BATTLES / SIMULATIONS)
-- ============================================================================
CREATE TABLE committees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    short_name TEXT NOT NULL,
    hook TEXT NOT NULL,
    description TEXT NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('INDIVIDUAL', 'TEAM')),
    team_min_size INT NOT NULL DEFAULT 1 CHECK (team_min_size >= 1),
    team_max_size INT NOT NULL DEFAULT 1 CHECK (team_max_size >= team_min_size),
    date_text TEXT NOT NULL DEFAULT '16–17 October',
    venue_text TEXT NOT NULL DEFAULT 'APJ Block, NMAMIT',
    registration_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    capacity INT NOT NULL DEFAULT 50 CHECK (capacity > 0),
    is_open BOOLEAN NOT NULL DEFAULT true,
    public_capacity_visibility BOOLEAN NOT NULL DEFAULT false,
    display_order INT NOT NULL DEFAULT 1,
    visual_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. CATEGORY-BASED PRICING RULES
-- ============================================================================
CREATE TABLE registration_fee_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('ISE', 'NON_ISE', 'EXTERNAL', 'SPECIAL')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(committee_id, category)
);

-- ============================================================================
-- 4. PORTFOLIOS (ROLES IN THE ARENA)
-- ============================================================================
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    capacity INT NOT NULL DEFAULT 10 CHECK (capacity >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 1,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. REGISTRATIONS
-- ============================================================================
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number TEXT UNIQUE NOT NULL,
    auth_user_id UUID NOT NULL,
    committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE RESTRICT,
    registration_type TEXT NOT NULL CHECK (registration_type IN ('INDIVIDUAL', 'TEAM')),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 
        'PAYMENT_PENDING', 
        'VERIFICATION_PENDING', 
        'RESUBMISSION_REQUIRED', 
        'CONFIRMED', 
        'REJECTED'
    )),
    contact_email TEXT NOT NULL,
    preferences_locked BOOLEAN NOT NULL DEFAULT false,
    assignment_status TEXT NOT NULL DEFAULT 'UNASSIGNED' CHECK (assignment_status IN ('UNASSIGNED', 'ASSIGNED')),
    reveal_status TEXT NOT NULL DEFAULT 'HIDDEN' CHECK (reveal_status IN ('HIDDEN', 'REVEALED')),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 6. INDIVIDUAL PARTICIPANTS (BOLLYWOOD & LOK SABHA)
-- ============================================================================
CREATE TABLE individual_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    usn TEXT NOT NULL,
    email TEXT NOT NULL,
    branch TEXT NOT NULL,
    year TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 7. TEAMS & TEAM MEMBERS (IPL MEGA AUCTION 2027)
-- ============================================================================
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    usn TEXT NOT NULL,
    email TEXT NOT NULL,
    branch TEXT NOT NULL,
    year TEXT NOT NULL,
    is_leader BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 8. PREFERENCES (RANK 1, 2, 3)
-- ============================================================================
CREATE TABLE preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE RESTRICT,
    rank INT NOT NULL CHECK (rank BETWEEN 1 AND 3),
    locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(registration_id, rank),
    UNIQUE(registration_id, portfolio_id)
);

-- ============================================================================
-- 9. PAYMENTS & SNAPSHOTS
-- ============================================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    pricing_rule_id UUID REFERENCES registration_fee_rules(id) ON DELETE SET NULL,
    pricing_category TEXT NOT NULL,
    original_amount NUMERIC(10, 2),
    override_amount NUMERIC(10, 2),
    override_reason TEXT,
    overridden_by UUID,
    overridden_at TIMESTAMPTZ,
    utr TEXT NOT NULL,
    screenshot_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN (
        'SUBMITTED', 
        'VERIFIED', 
        'REJECTED', 
        'RESUBMISSION_REQUIRED'
    )),
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    verified_by UUID
);

-- ============================================================================
-- 10. ASSIGNMENTS & RUNS
-- ============================================================================
CREATE TABLE assignment_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    run_type TEXT NOT NULL DEFAULT 'AUTO_BALANCED' CHECK (run_type IN ('AUTO_BALANCED', 'MANUAL_CAPACITY')),
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE RESTRICT,
    preference_rank INT CHECK (preference_rank BETWEEN 1 AND 3),
    assignment_type TEXT NOT NULL DEFAULT 'AUTOMATIC' CHECK (assignment_type IN ('AUTOMATIC', 'MANUAL')),
    assignment_run_id UUID REFERENCES assignment_runs(id) ON DELETE SET NULL,
    previous_portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,
    override_reason TEXT,
    assigned_by UUID,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 11. REVEALS
-- ============================================================================
CREATE TABLE reveals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
    mode TEXT NOT NULL DEFAULT 'CINEMATIC' CHECK (mode IN ('CINEMATIC', 'SIMPLE')),
    revealed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revealed_by UUID
);

-- ============================================================================
-- 12. AUDIT LOGS
-- ============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 13. GLOBAL APP SETTINGS
-- ============================================================================
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- HELPER FUNCTIONS & PROCEDURES
-- ============================================================================

-- Function: Generate Registration ID sequence safely
CREATE OR REPLACE FUNCTION generate_registration_number(p_format TEXT)
RETURNS TEXT AS $$
DECLARE
    v_seq_val INT;
    v_result TEXT;
BEGIN
    IF p_format = 'TEAM' THEN
        SELECT nextval('ipl_reg_seq') INTO v_seq_val;
        v_result := 'THEV-IPL-' || LPAD(v_seq_val::TEXT, 5, '0');
    ELSE
        SELECT nextval('individual_reg_seq') INTO v_seq_val;
        v_result := 'THEV-' || LPAD(v_seq_val::TEXT, 5, '0');
    END IF;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function: Resolve Category from branch name
CREATE OR REPLACE FUNCTION resolve_participant_category(p_branch TEXT)
RETURNS TEXT AS $$
BEGIN
    IF p_branch ILIKE '%Information Science%' 
       OR p_branch ILIKE '%ISE%' 
       OR p_branch ILIKE '%IS&E%'
       OR p_branch ILIKE '%IS%' THEN
        RETURN 'ISE';
    ELSE
        RETURN 'NON_ISE';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Server-side pricing resolution
CREATE OR REPLACE FUNCTION calculate_registration_fee(
    p_committee_id UUID, 
    p_branch TEXT
)
RETURNS TABLE (
    calculated_amount NUMERIC(10,2),
    resolved_category TEXT,
    rule_id UUID
) AS $$
DECLARE
    v_cat TEXT;
    v_rec RECORD;
BEGIN
    v_cat := resolve_participant_category(p_branch);

    SELECT id, amount INTO v_rec
    FROM registration_fee_rules
    WHERE committee_id = p_committee_id 
      AND category = v_cat 
      AND is_active = true
    LIMIT 1;

    IF FOUND THEN
        RETURN QUERY SELECT v_rec.amount, v_cat, v_rec.id;
    ELSE
        -- Fallback to committee base fee if specific rule is missing
        SELECT c.id, c.registration_fee INTO v_rec
        FROM committees c
        WHERE c.id = p_committee_id;

        RETURN QUERY SELECT v_rec.registration_fee, v_cat, NULL::UUID;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger: Ensure team size constraint (2 to 3 members)
CREATE OR REPLACE FUNCTION check_team_size()
RETURNS TRIGGER AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM team_members WHERE team_id = NEW.team_id;
    IF v_count > 3 THEN
        RAISE EXCEPTION 'Team size cannot exceed 3 members.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_check_team_size
AFTER INSERT OR UPDATE ON team_members
FOR EACH ROW EXECUTE FUNCTION check_team_size();

-- Trigger: Keep updated_at timestamps fresh
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comm_ts BEFORE UPDATE ON committees FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_port_ts BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_reg_ts BEFORE UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_fees_ts BEFORE UPDATE ON registration_fee_rules FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- PORTFOLIO ASSIGNMENT ENGINE (POSTGRESQL RPC)
-- ============================================================================
CREATE OR REPLACE FUNCTION run_portfolio_assignment(
    p_committee_id UUID,
    p_mode TEXT DEFAULT 'AUTO_BALANCED',
    p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_run_id UUID;
    v_reg RECORD;
    v_assigned_count INT := 0;
    v_pref RECORD;
    v_assigned BOOLEAN;
    v_port RECORD;
BEGIN
    -- Create Assignment Run record
    INSERT INTO assignment_runs (committee_id, run_type, created_by, metadata)
    VALUES (p_committee_id, p_mode, p_admin_id, jsonb_build_object('started_at', now()))
    RETURNING id INTO v_run_id;

    -- Process confirmed registrations without assignment for this committee
    FOR v_reg IN 
        SELECT r.id, r.registration_number
        FROM registrations r
        WHERE r.committee_id = p_committee_id
          AND r.status = 'CONFIRMED'
          AND r.assignment_status = 'UNASSIGNED'
        ORDER BY random() -- Fair randomized draw among equals
    LOOP
        v_assigned := false;

        -- Round 1, 2, 3 preferences
        FOR v_pref IN
            SELECT p.portfolio_id, p.rank, port.capacity,
                   (SELECT COUNT(*) FROM assignments a WHERE a.portfolio_id = p.portfolio_id) AS current_assigned
            FROM preferences p
            JOIN portfolios port ON port.id = p.portfolio_id
            WHERE p.registration_id = v_reg.id
              AND port.is_active = true
            ORDER BY p.rank ASC
        LOOP
            IF v_pref.current_assigned < v_pref.capacity THEN
                INSERT INTO assignments (
                    registration_id, 
                    portfolio_id, 
                    preference_rank, 
                    assignment_type, 
                    assignment_run_id, 
                    assigned_by
                ) VALUES (
                    v_reg.id, 
                    v_pref.portfolio_id, 
                    v_pref.rank, 
                    'AUTOMATIC', 
                    v_run_id, 
                    p_admin_id
                );

                UPDATE registrations 
                SET assignment_status = 'ASSIGNED', updated_at = now()
                WHERE id = v_reg.id;

                v_assigned := true;
                v_assigned_count := v_assigned_count + 1;
                EXIT; -- Exit preference loop once allocated
            END IF;
        END LOOP;

        -- Fallback: If preferences 1, 2, 3 were full, allocate any remaining open portfolio
        IF NOT v_assigned THEN
            FOR v_port IN 
                SELECT port.id, port.capacity,
                       (SELECT COUNT(*) FROM assignments a WHERE a.portfolio_id = port.id) AS current_assigned
                FROM portfolios port
                WHERE port.committee_id = p_committee_id
                  AND port.is_active = true
                ORDER BY (port.capacity - (SELECT COUNT(*) FROM assignments a WHERE a.portfolio_id = port.id)) DESC
            LOOP
                IF v_port.current_assigned < v_port.capacity THEN
                    INSERT INTO assignments (
                        registration_id, 
                        portfolio_id, 
                        preference_rank, 
                        assignment_type, 
                        assignment_run_id, 
                        assigned_by
                    ) VALUES (
                        v_reg.id, 
                        v_port.id, 
                        NULL, 
                        'AUTOMATIC', 
                        v_run_id, 
                        p_admin_id
                    );

                    UPDATE registrations 
                    SET assignment_status = 'ASSIGNED', updated_at = now()
                    WHERE id = v_reg.id;

                    v_assigned := true;
                    v_assigned_count := v_assigned_count + 1;
                    EXIT;
                END IF;
            END LOOP;
        END IF;
    END LOOP;

    -- Log to audit
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_data)
    VALUES (
        p_admin_id, 
        'ASSIGNMENT_RUN_COMPLETED', 
        'assignment_runs', 
        v_run_id, 
        jsonb_build_object(
            'committee_id', p_committee_id,
            'assigned_count', v_assigned_count,
            'mode', p_mode
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'run_id', v_run_id,
        'assigned_count', v_assigned_count
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_fee_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reveals ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 1. Committees & Portfolios: Publicly viewable
CREATE POLICY "Public can view committees" ON committees FOR SELECT USING (true);
CREATE POLICY "Public can view active portfolios" ON portfolios FOR SELECT USING (true);
CREATE POLICY "Public can view active pricing rules" ON registration_fee_rules FOR SELECT USING (true);
CREATE POLICY "Public can view app settings" ON app_settings FOR SELECT USING (true);

-- 2. Profiles: Users can view & update their own profile; Admin can view all
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = auth_user_id);

-- 3. Registrations: Users can view and manage their own registrations
CREATE POLICY "Users view own registrations" ON registrations FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users create own registrations" ON registrations FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "Users update draft registrations" ON registrations FOR UPDATE USING (
    auth.uid() = auth_user_id AND status IN ('DRAFT', 'RESUBMISSION_REQUIRED')
);

-- 4. Participants & Teams: Users can view their own details
CREATE POLICY "Users view own individual participant" ON individual_participants FOR SELECT USING (
    EXISTS (SELECT 1 FROM registrations r WHERE r.id = individual_participants.registration_id AND r.auth_user_id = auth.uid())
);
CREATE POLICY "Users insert own individual participant" ON individual_participants FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM registrations r WHERE r.id = individual_participants.registration_id AND r.auth_user_id = auth.uid())
);

CREATE POLICY "Users view own team" ON teams FOR SELECT USING (
    EXISTS (SELECT 1 FROM registrations r WHERE r.id = teams.registration_id AND r.auth_user_id = auth.uid())
);
CREATE POLICY "Users insert own team" ON teams FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM registrations r WHERE r.id = teams.registration_id AND r.auth_user_id = auth.uid())
);

CREATE POLICY "Users view own team members" ON team_members FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM teams t 
        JOIN registrations r ON r.id = t.registration_id 
        WHERE t.id = team_members.team_id AND r.auth_user_id = auth.uid()
    )
);
CREATE POLICY "Users insert own team members" ON team_members FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM teams t 
        JOIN registrations r ON r.id = t.registration_id 
        WHERE t.id = team_members.team_id AND r.auth_user_id = auth.uid()
    )
);

-- 5. Preferences: Users can insert and read preferences for their registration
CREATE POLICY "Users view own preferences" ON preferences FOR SELECT USING (
    EXISTS (SELECT 1 FROM registrations r WHERE r.id = preferences.registration_id AND r.auth_user_id = auth.uid())
);
CREATE POLICY "Users insert own preferences" ON preferences FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM registrations r WHERE r.id = preferences.registration_id AND r.auth_user_id = auth.uid())
);

-- 6. Payments: Users can insert payment and view their own payment status
CREATE POLICY "Users view own payments" ON payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM registrations r WHERE r.id = payments.registration_id AND r.auth_user_id = auth.uid())
);
CREATE POLICY "Users insert own payments" ON payments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM registrations r WHERE r.id = payments.registration_id AND r.auth_user_id = auth.uid())
);

-- 7. Assignments: Users can ONLY view their assignment IF reveal_status is 'REVEALED'
CREATE POLICY "Users view assignment after reveal" ON assignments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM registrations r 
        WHERE r.id = assignments.registration_id 
          AND r.auth_user_id = auth.uid() 
          AND r.reveal_status = 'REVEALED'
    )
);

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- 1. COMMITTEES
INSERT INTO committees (id, name, slug, short_name, hook, description, format, team_min_size, team_max_size, date_text, venue_text, registration_fee, capacity, is_open, public_capacity_visibility, display_order, visual_config)
VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'BOLLYWOOD SAGA',
    'bollywood-saga',
    'BOLLYWOOD',
    'Build India''s next billion-dollar blockbuster.',
    'Step into the ruthless epicenter of Indian cinema. Pitch stories, secure talent, survive scandals, navigate box office warfare, and construct a legacy that echoes across generations.',
    'INDIVIDUAL',
    1,
    1,
    '16–17 October',
    'APJ Block, NMAMIT',
    350.00,
    60,
    true,
    true,
    1,
    '{"theme": "crimson", "accent": "#DC2626", "badge": "CINEMA SIMULATION"}'::jsonb
),
(
    '22222222-2222-2222-2222-222222222222',
    'IPL MEGA AUCTION 2027',
    'ipl-mega-auction',
    'IPL AUCTION',
    'Build your franchise. Outbid everyone.',
    'High-stakes bidding warfare. Balance your purse, exploit auction dynamics, manage marquee player demands, build unmatched squad depth, and claim the championship crown before the hammer strikes.',
    'TEAM',
    2,
    3,
    '16–17 October',
    'APJ Block, NMAMIT',
    750.00,
    30,
    true,
    true,
    2,
    '{"theme": "gold", "accent": "#F59E0B", "badge": "HIGH-STAKES AUCTION"}'::jsonb
),
(
    '33333333-3333-3333-3333-333333333333',
    'LOK SABHA',
    'lok-sabha',
    'LOK SABHA',
    'Power. Policy. Politics.',
    'The floor of the sovereign Parliament is open. Table historic bills, broker backroom coalitions, deliver thunderous orations, outmaneuver political rebellions, and defend the national interest.',
    'INDIVIDUAL',
    1,
    1,
    '16–17 October',
    'APJ Block, NMAMIT',
    350.00,
    60,
    true,
    true,
    3,
    '{"theme": "slate", "accent": "#38BDF8", "badge": "POLITICAL PARLIAMENT"}'::jsonb
);

-- 2. CATEGORY-BASED PRICING RULES (ISE vs NON-ISE)
INSERT INTO registration_fee_rules (committee_id, category, amount, currency, is_active)
VALUES
-- Bollywood Saga
('11111111-1111-1111-1111-111111111111', 'ISE', 250.00, 'INR', true),
('11111111-1111-1111-1111-111111111111', 'NON_ISE', 350.00, 'INR', true),

-- IPL Mega Auction 2027 (Team Registration: 2-3 Members)
('22222222-2222-2222-2222-222222222222', 'ISE', 600.00, 'INR', true),
('22222222-2222-2222-2222-222222222222', 'NON_ISE', 750.00, 'INR', true),

-- Lok Sabha
('33333333-3333-3333-3333-333333333333', 'ISE', 250.00, 'INR', true),
('33333333-3333-3333-3333-333333333333', 'NON_ISE', 350.00, 'INR', true);

-- 3. PORTFOLIOS FOR BOLLYWOOD SAGA
INSERT INTO portfolios (committee_id, name, description, short_description, capacity, display_order)
VALUES
('11111111-1111-1111-1111-111111111111', 'Visionary Studio Producer', 'Controls production finance, greenlights script budgets, and leads distribution.', 'Production & Finance Executive', 10, 1),
('11111111-1111-1111-1111-111111111111', 'Auteur Director', 'Commanding the creative vision, casting dynamics, and cinematic aesthetics.', 'Creative Mastermind', 10, 2),
('11111111-1111-1111-1111-111111111111', 'Superstar Celebrity Lead', 'Commands massive fan equity, box office pull, and brand endorsement power.', 'Top-Billing Actor / Box Office Anchor', 10, 3),
('11111111-1111-1111-1111-111111111111', 'Aggressive Media Mogul', 'Dictates PR narratives, scandal campaigns, and opening weekend hysteria.', 'Tabloid & Press Magnate', 10, 4),
('11111111-1111-1111-1111-111111111111', 'OTT Streaming Tycoon', 'Monopolizes global streaming rights, algorithmic hype, and digital release.', 'Global Digital Distribution Chief', 10, 5),
('11111111-1111-1111-1111-111111111111', 'Renowned Screenplay Architect', 'Crafts dialogue, narrative twists, and high-voltage emotional hooks.', 'Master Scriptwriter', 10, 6);

-- 4. PORTFOLIOS FOR IPL MEGA AUCTION 2027 (FRANCHISES)
INSERT INTO portfolios (committee_id, name, description, short_description, capacity, display_order)
VALUES
('22222222-2222-2222-2222-222222222222', 'Mumbai Indians Think Tank', 'Data-driven dynasty builder with unmatched scout network and winning pedigree.', '5-Time Championship Franchise', 5, 1),
('22222222-2222-2222-2222-222222222222', 'Chennai Super Kings War Room', 'Masters of clutch strategy, experienced leadership, and fortress dominance.', 'Yellow Army Strategic Council', 5, 2),
('22222222-2222-2222-2222-222222222222', 'Royal Challengers Bengaluru Board', 'High-voltage brand power, explosive batting philosophies, and passionate fan capital.', 'Bold & Audacious Franchise', 5, 3),
('22222222-2222-2222-2222-222222222222', 'Kolkata Knight Riders Syndicate', 'Moneyball pioneers, spin choke tacticians, and aggressive purse manipulators.', 'Knights Auction Syndicate', 5, 4),
('22222222-2222-2222-2222-222222222222', 'Sunrisers Hyderabad Command', 'All-out blitzkrieg, record-breaking batting aggression, and precision fast bowling.', 'Orange Army Strike Group', 5, 5),
('22222222-2222-2222-2222-222222222222', 'Gujarat Titans Operations', 'Unorthodox leadership, death-over specialists, and tactical efficiency.', 'New-Era Championship Contender', 5, 6);

-- 5. PORTFOLIOS FOR LOK SABHA
INSERT INTO portfolios (committee_id, name, description, short_description, capacity, display_order)
VALUES
('33333333-3333-3333-3333-333333333333', 'Minister of Home Affairs', 'Oversees internal security, legislative order, federal policing, and state relations.', 'Union Cabinet Minister', 10, 1),
('33333333-3333-3333-3333-333333333333', 'Minister of Finance', 'Commands the sovereign budget, fiscal reform, taxation, and economic policy.', 'Fiscal & Economic Portfolio', 10, 2),
('33333333-3333-3333-3333-333333333333', 'Leader of the Opposition', 'Holding the executive accountable, building opposition consensus, and staging walkouts.', 'Shadow Leader of the House', 10, 3),
('33333333-3333-3333-3333-333333333333', 'Speaker of the Lok Sabha', 'Neutral custodian of parliamentary decorum, bill voting, and member suspensions.', 'Presiding Officer of the House', 5, 4),
('33333333-3333-3333-3333-333333333333', 'Minister of External Affairs', 'Navigating geopolitical treaties, border sovereignty, and international diplomacy.', 'Foreign & Strategic Affairs', 10, 5),
('33333333-3333-3333-3333-333333333333', 'Key Coalition Kingmaker MP', 'Crucial swing votes, bargaining for state packages, and testing confidence motions.', 'Regional Powerbroker', 10, 6);

-- 6. APP SETTINGS
INSERT INTO app_settings (key, value)
VALUES
('event_info', '{
    "name": "VISTA PRESENTS: THE VERDICT",
    "dates": "16–17 October",
    "venue": "APJ Block, NMAMIT",
    "registration_open": true,
    "upi_id": "vista.verdict@oksbi",
    "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dvista.verdict%40oksbi%26pn%3DVISTA%2520PRESENTS%2520THE%2520VERDICT%26cu%3DINR",
    "support_contact": "verdict.vista@nmamit.ac.in",
    "whatsapp_configured": false,
    "email_configured": false
}'::jsonb);

-- ============================================================================
-- 7. STORAGE BUCKETS & SECURITY POLICIES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('payment-screenshots', 'payment-screenshots', false),
    ('event-assets', 'event-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Authenticated participants can upload payment screenshots
CREATE POLICY "Authenticated users can upload payment screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-screenshots');

-- Storage Policy: Users can view their own payment screenshots, Admins can view all
CREATE POLICY "Users and admins can view payment screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'payment-screenshots' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] 
        OR EXISTS (SELECT 1 FROM profiles WHERE profiles.auth_user_id = auth.uid() AND profiles.role = 'admin')
    )
);

-- Storage Policy: Public can view event assets (QR codes, logos)
CREATE POLICY "Public read event assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-assets');
