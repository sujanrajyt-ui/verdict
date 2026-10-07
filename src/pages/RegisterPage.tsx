import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { notificationService } from '../services/notificationService';
import { Committee, PricingRule, Portfolio, AppSettings, FullRegistrationDetail } from '../types';
import { StageIndicator } from '../components/registration/StageIndicator';
import { Stage01BattleSelect } from '../components/registration/Stage01BattleSelect';
import { Stage02RoleClaim } from '../components/registration/Stage02RoleClaim';
import { Stage03EnterArena, IndividualFormData, TeamFormData } from '../components/registration/Stage03EnterArena';
import { Stage04SecureEntry } from '../components/registration/Stage04SecureEntry';
import { RegistrationSuccessModal } from '../components/registration/RegistrationSuccessModal';
import { ChangeBattleConfirmDialog } from '../components/registration/ChangeBattleConfirmDialog';
import { Lock, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const DRAFT_STORAGE_KEY = 'vista_reg_draft_v1';

export const RegisterPage: React.FC = () => {
  const { user } = useAuth();

  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [confirmedCounts, setConfirmedCounts] = useState<Record<string, number>>({});
  const [existingUserReg, setExistingUserReg] = useState<FullRegistrationDetail | null>(null);

  // Registration draft state
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string | null>(null);
  const [rankedPortfolioIds, setRankedPortfolioIds] = useState<[string | null, string | null, string | null]>([
    null,
    null,
    null,
  ]);

  const [individualData, setIndividualData] = useState<IndividualFormData>({
    fullName: user?.full_name || '',
    usn: '',
    email: user?.email || '',
    branch: '',
    year: '3rd Year',
  });

  const [teamData, setTeamData] = useState<TeamFormData>({
    teamName: '',
    leader: {
      fullName: user?.full_name || '',
      usn: '',
      email: user?.email || '',
      branch: '',
      year: '3rd Year',
    },
    members: [
      {
        id: 'm-init-1',
        fullName: '',
        usn: '',
        email: '',
        branch: '',
        year: '3rd Year',
      },
    ],
  });

  const [paymentData, setPaymentData] = useState<{ utr: string; screenshotPath: string }>({
    utr: '',
    screenshotPath: '',
  });

  // Flow & Modal state
  const [changeBattleDialogOpen, setChangeBattleDialogOpen] = useState<boolean>(false);
  const [pendingCommitteeSwitch, setPendingCommitteeSwitch] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submittedRegistration, setSubmittedRegistration] = useState<FullRegistrationDetail | null>(null);

  // Load Initial Event Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [commList, rulesList, portList, settings, allRegs] = await Promise.all([
          dataService.getCommittees(),
          dataService.getPricingRules(),
          dataService.getPortfolios(),
          dataService.getAppSettings(),
          dataService.getAllRegistrations(),
        ]);

        setCommittees(commList);
        setPricingRules(rulesList);
        setPortfolios(portList);
        setAppSettings(settings);

        // Count confirmed per committee
        const counts: Record<string, number> = {};
        allRegs.forEach((r) => {
          if (r.registration.status === 'CONFIRMED') {
            counts[r.registration.committee_id] = (counts[r.registration.committee_id] || 0) + 1;
          }
        });
        setConfirmedCounts(counts);

        // Check if current user already registered
        if (user) {
          const userReg = await dataService.getRegistrationForUser(user.auth_user_id);
          setExistingUserReg(userReg);
        }

        // Restore saved draft if safe
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            if (parsed.selectedCommitteeId) setSelectedCommitteeId(parsed.selectedCommitteeId);
            if (parsed.rankedPortfolioIds) setRankedPortfolioIds(parsed.rankedPortfolioIds);
            if (parsed.individualData) setIndividualData(parsed.individualData);
            if (parsed.teamData) setTeamData(parsed.teamData);
          } catch {
            // Ignore corrupted draft
          }
        }
      } catch (err) {
        console.error('Failed to load registration data', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Persist draft to local storage on changes
  useEffect(() => {
    if (selectedCommitteeId) {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          selectedCommitteeId,
          rankedPortfolioIds,
          individualData,
          teamData,
        })
      );
    }
  }, [selectedCommitteeId, rankedPortfolioIds, individualData, teamData]);

  const selectedCommittee = committees.find((c) => c.id === selectedCommitteeId);
  const activePortfolios = portfolios.filter((p) => p.committee_id === selectedCommitteeId && p.is_active);

  // Handlers for switching committee
  const handleSelectCommittee = (committeeId: string) => {
    if (selectedCommitteeId && selectedCommitteeId !== committeeId) {
      // Check if user has already ranked portfolios
      const hasPreferences = rankedPortfolioIds.some((id) => id !== null);
      if (hasPreferences) {
        setPendingCommitteeSwitch(committeeId);
        setChangeBattleDialogOpen(true);
        return;
      }
    }
    setSelectedCommitteeId(committeeId);
  };

  const confirmChangeBattle = () => {
    setSelectedCommitteeId(pendingCommitteeSwitch);
    setRankedPortfolioIds([null, null, null]);
    setPendingCommitteeSwitch(null);
    setChangeBattleDialogOpen(false);
    setCurrentStage(1);
  };

  const handleRankPortfolio = (rankIndex: 0 | 1 | 2, portfolioId: string | null) => {
    const updated = [...rankedPortfolioIds] as [string | null, string | null, string | null];
    updated[rankIndex] = portfolioId;
    setRankedPortfolioIds(updated);
  };

  // Submit Final Registration (Server-side snapshot and sequence)
  const handleSubmitRegistration = async () => {
    if (!selectedCommittee || !selectedCommitteeId) return;
    if (!rankedPortfolioIds[0] || !rankedPortfolioIds[1] || !rankedPortfolioIds[2]) {
      setSubmissionError('Please select all top 3 portfolio preferences.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const authUserId = user?.auth_user_id || 'auth-guest-' + Math.random().toString(36).substring(2, 7);
      const contactEmail = selectedCommittee.format === 'TEAM' ? teamData.leader.email : individualData.email;

      const newRegistration = await dataService.submitRegistration({
        authUserId,
        contactEmail,
        committeeId: selectedCommitteeId,
        registrationType: selectedCommittee.format,
        portfolioIds: [rankedPortfolioIds[0], rankedPortfolioIds[1], rankedPortfolioIds[2]],
        individualData: selectedCommittee.format === 'INDIVIDUAL' ? individualData : undefined,
        teamData: selectedCommittee.format === 'TEAM' ? teamData : undefined,
        paymentData: {
          utr: paymentData.utr,
          screenshotPath: paymentData.screenshotPath,
        },
      });

      // Clear draft storage
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      // Trigger notification dispatch
      notificationService.sendEmail({
        toEmail: contactEmail,
        recipientName: selectedCommittee.format === 'TEAM' ? teamData.teamName : individualData.fullName,
        registrationNumber: newRegistration.registration.registration_number,
        committeeName: selectedCommittee.name,
        type: 'REGISTRATION_RECEIVED',
      });

      notificationService.sendWhatsApp({
        toEmail: contactEmail,
        recipientName: selectedCommittee.format === 'TEAM' ? teamData.teamName : individualData.fullName,
        registrationNumber: newRegistration.registration.registration_number,
        committeeName: selectedCommittee.name,
        type: 'REGISTRATION_RECEIVED',
      });

      setSubmittedRegistration(newRegistration);
    } catch (err: any) {
      console.error('Registration submission error:', err);
      setSubmissionError(err?.message || 'Something went wrong while saving your registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
        <p className="font-mono-code text-xs text-zinc-400 tracking-widest uppercase">
          INITIALIZING ARENA SYSTEMS...
        </p>
      </div>
    );
  }

  // 1. Registration Globally Closed
  if (appSettings && !appSettings.registration_open) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-700/80 flex items-center justify-center mx-auto text-red-500">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="font-cinzel text-3xl sm:text-5xl font-black text-white uppercase tracking-wider">
          REGISTRATION CLOSED
        </h1>
        <p className="font-mono-code text-sm text-zinc-400 leading-relaxed">
          Public admission for VISTA PRESENTS: THE VERDICT is currently suspended. Delegates who have already secured their clearance may access their live credentials via the participant dashboard.
        </p>
        <div className="pt-4">
          <a
            href="/dashboard"
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-lg font-cinzel font-bold text-xs uppercase bg-zinc-900 border border-white/10 text-white hover:border-red-600 transition-colors"
          >
            <span>VIEW EXISTING DOSSIER</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  // 2. Existing Registration Protection (Section 55)
  if (existingUserReg) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/20 flex items-center justify-center mx-auto text-red-500">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="font-cinzel text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-wider">
          YOU ALREADY HAVE A REGISTRATION
        </h1>
        <p className="font-mono-code text-sm text-zinc-400 leading-relaxed">
          An active simulation dossier exists for your identity under Registration ID:{' '}
          <strong className="text-red-500">{existingUserReg.registration.registration_number}</strong> ({existingUserReg.committee?.name}).
        </p>
        <div className="pt-4">
          <a
            href="/dashboard"
            className="inline-flex items-center space-x-2 px-10 py-4 rounded-lg font-cinzel font-extrabold text-sm uppercase bg-red-700 hover:bg-red-600 text-white shadow-xl shadow-red-950/60 ring-1 ring-red-500 transition-all"
          >
            <span>VIEW DASHBOARD →</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      {/* 4-Stage Navigation Indicator */}
      <StageIndicator
        currentStage={currentStage}
        onSelectStage={(stage) => {
          if (stage === 1) setCurrentStage(1);
          else if (stage === 2 && selectedCommitteeId) setCurrentStage(2);
          else if (stage === 3 && selectedCommitteeId && rankedPortfolioIds[0] && rankedPortfolioIds[1] && rankedPortfolioIds[2]) setCurrentStage(3);
          else if (stage === 4 && selectedCommitteeId) setCurrentStage(4);
        }}
        canNavigateTo={(stage) => {
          if (stage === 1) return true;
          if (stage === 2) return Boolean(selectedCommitteeId);
          if (stage === 3) return Boolean(selectedCommitteeId && rankedPortfolioIds[0] && rankedPortfolioIds[1] && rankedPortfolioIds[2]);
          if (stage === 4) return Boolean(selectedCommitteeId && rankedPortfolioIds[0] && rankedPortfolioIds[1] && rankedPortfolioIds[2]);
          return false;
        }}
      />

      {/* STAGE 01: CHOOSE YOUR BATTLE */}
      {currentStage === 1 && (
        <Stage01BattleSelect
          committees={committees}
          selectedCommitteeId={selectedCommitteeId}
          onSelectCommittee={handleSelectCommittee}
          onProceed={() => setCurrentStage(2)}
          confirmedCountsByCommittee={confirmedCounts}
        />
      )}

      {/* STAGE 02: CLAIM YOUR ROLE */}
      {currentStage === 2 && selectedCommittee && (
        <Stage02RoleClaim
          committee={selectedCommittee}
          portfolios={activePortfolios}
          selectedPortfolioIds={rankedPortfolioIds}
          onRankPortfolio={handleRankPortfolio}
          onProceed={() => setCurrentStage(3)}
          onRequestChangeBattle={() => {
            setPendingCommitteeSwitch(null);
            setChangeBattleDialogOpen(true);
          }}
        />
      )}

      {/* STAGE 03: ENTER THE ARENA */}
      {currentStage === 3 && selectedCommittee && (
        <Stage03EnterArena
          committee={selectedCommittee}
          individualData={individualData}
          teamData={teamData}
          onUpdateIndividual={setIndividualData}
          onUpdateTeam={setTeamData}
          onProceed={() => setCurrentStage(4)}
          onBack={() => setCurrentStage(2)}
        />
      )}

      {/* STAGE 04: SECURE YOUR ENTRY */}
      {currentStage === 4 && selectedCommittee && appSettings && (
        <Stage04SecureEntry
          committee={selectedCommittee}
          pricingRules={pricingRules}
          appSettings={appSettings}
          branch={selectedCommittee.format === 'TEAM' ? teamData.leader.branch : individualData.branch}
          utr={paymentData.utr}
          screenshotPath={paymentData.screenshotPath}
          onUpdatePayment={(utr, screenshotPath) => setPaymentData({ utr, screenshotPath })}
          onSubmitRegistration={handleSubmitRegistration}
          onBack={() => setCurrentStage(3)}
          isSubmitting={isSubmitting}
          submissionError={submissionError}
        />
      )}

      {/* Confirm Battle Change Modal */}
      <ChangeBattleConfirmDialog
        isOpen={changeBattleDialogOpen}
        onCancel={() => {
          setChangeBattleDialogOpen(false);
          setPendingCommitteeSwitch(null);
        }}
        onConfirm={confirmChangeBattle}
      />

      {/* Registration Success Modal */}
      {submittedRegistration && (
        <RegistrationSuccessModal
          registrationDetail={submittedRegistration}
          onGoToDashboard={() => {
            window.location.href = '/dashboard';
          }}
        />
      )}
    </div>
  );
};
