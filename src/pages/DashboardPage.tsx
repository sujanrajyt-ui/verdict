import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { FullRegistrationDetail, TeamMember } from '../types';
import { formatCurrency } from '../utils/pricing';
import { 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Edit3, 
  Sparkles, 
  Award, 
  Users, 
  CreditCard, 
  Calendar, 
  MapPin, 
  Save, 
  X,
  UploadCloud,
  FileCheck,
  Eye,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [registrationDetail, setRegistrationDetail] = useState<FullRegistrationDetail | null>(null);

  // Participant editing state (allowed only before admin confirmation)
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<{
    contactEmail: string;
    fullName: string;
    usn: string;
    branch: string;
    year: string;
    teamName: string;
    members: TeamMember[];
  }>({
    contactEmail: '',
    fullName: '',
    usn: '',
    branch: '',
    year: '',
    teamName: '',
    members: [],
  });

  // Resubmission state (if admin rejected payment)
  const [isResubmittingPayment, setIsResubmittingPayment] = useState<boolean>(false);
  const [newUtr, setNewUtr] = useState<string>('');
  const [newScreenshot, setNewScreenshot] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const reg = await dataService.getRegistrationForUser(user.auth_user_id);
      setRegistrationDetail(reg);

      if (reg) {
        setEditFormData({
          contactEmail: reg.registration.contact_email,
          fullName: reg.individual?.full_name || reg.team_members?.[0]?.full_name || '',
          usn: reg.individual?.usn || reg.team_members?.[0]?.usn || '',
          branch: reg.individual?.branch || reg.team_members?.[0]?.branch || '',
          year: reg.individual?.year || reg.team_members?.[0]?.year || '',
          teamName: reg.team?.team_name || '',
          members: reg.team_members || [],
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleSaveParticipantEdits = async () => {
    if (!registrationDetail) return;
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      const isTeam = registrationDetail.registration.registration_type === 'TEAM';
      const updated = await dataService.updateParticipantDetails(registrationDetail.registration.id, {
        contactEmail: editFormData.contactEmail,
        individual: !isTeam ? {
          full_name: editFormData.fullName,
          usn: editFormData.usn.toUpperCase(),
          branch: editFormData.branch,
          year: editFormData.year,
        } : undefined,
        teamName: isTeam ? editFormData.teamName : undefined,
        members: isTeam ? editFormData.members : undefined,
      });

      setRegistrationDetail(updated);
      setIsEditing(false);
      setSaveSuccessMsg('Personal credentials updated successfully.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      setSaveErrorMsg(err?.message || 'Failed to update credentials.');
    }
  };

  const handleResubmitPayment = async () => {
    if (!registrationDetail?.payment) return;
    if (!newUtr.trim() || !newScreenshot) {
      setSaveErrorMsg('Please provide both new UTR and receipt screenshot.');
      return;
    }

    try {
      await dataService.resubmitPayment(registrationDetail.payment.id, newUtr, newScreenshot);
      setIsResubmittingPayment(false);
      setSaveSuccessMsg('Payment resubmitted. Verification in progress.');
      await fetchDashboardData();
    } catch (err: any) {
      setSaveErrorMsg(err?.message || 'Failed to resubmit payment.');
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
        <p className="font-mono-code text-xs text-zinc-400 tracking-widest uppercase">
          DECRYPTING PARTICIPANT DOSSIER...
        </p>
      </div>
    );
  }

  // No active registration state
  if (!registrationDetail) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-zinc-600">
          <Award className="w-8 h-8" />
        </div>
        <h1 className="font-cinzel text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-wider">
          NO DOSSIER DETECTED
        </h1>
        <p className="font-mono-code text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
          You have not entered a simulation arena yet. Step into the arena to claim your role.
        </p>
        <div className="pt-4">
          <a
            href="/register"
            className="inline-flex items-center space-x-2 px-10 py-4 rounded-lg font-cinzel font-bold text-sm uppercase bg-red-700 hover:bg-red-600 text-white shadow-xl shadow-red-950/60 ring-1 ring-red-500 transition-all"
          >
            <span>ENTER THE ARENA →</span>
          </a>
        </div>
      </div>
    );
  }

  const { registration: reg, committee: comm, individual: ind, team, team_members: members, preferences: prefs, payment: pay, assignment: asg } = registrationDetail;
  const isConfirmed = reg.status === 'CONFIRMED';
  const isTeam = reg.registration_type === 'TEAM';
  const isRevealed = reg.reveal_status === 'REVEALED' && Boolean(asg);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fadeIn space-y-8">
      {/* Top Banner: Registration Identifier & Status Badges */}
      <div className="rounded-2xl border border-white/15 bg-zinc-950/80 backdrop-blur-md p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-red-950/80 border border-red-700 text-red-400 font-mono-code text-xs font-bold tracking-widest uppercase">
              {comm?.name}
            </span>

            {/* Registration Status Badge */}
            <span
              className={`px-2.5 py-0.5 rounded font-mono-code text-xs font-bold tracking-wider uppercase border ${
                reg.status === 'CONFIRMED'
                  ? 'bg-emerald-950/80 border-emerald-600 text-emerald-400'
                  : reg.status === 'RESUBMISSION_REQUIRED'
                  ? 'bg-amber-950/80 border-amber-600 text-amber-400'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300'
              }`}
            >
              {reg.status === 'CONFIRMED'
                ? 'REGISTRATION CONFIRMED'
                : reg.status === 'RESUBMISSION_REQUIRED'
                ? 'RESUBMISSION REQUIRED'
                : 'PAYMENT VERIFICATION PENDING'}
            </span>
          </div>

          <div className="text-zinc-500 font-mono-code text-xs tracking-widest uppercase">
            SIMULATION CLEARANCE ID
          </div>

          <h1 className="font-mono-code text-3xl sm:text-4xl font-extrabold tracking-wider text-white">
            {reg.registration_number}
          </h1>

          <div className="flex items-center space-x-4 text-xs font-mono-code text-zinc-400 pt-1">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>16–17 OCTOBER</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              <span>APJ BLOCK, NMAMIT</span>
            </div>
          </div>
        </div>

        {/* Action button if editing is allowed or locked */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {isConfirmed ? (
            <div className="px-4 py-2.5 rounded-lg bg-black/60 border border-emerald-900/50 text-emerald-400 text-xs font-mono-code flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>CREDENTIALS SEALED & VERIFIED</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2.5 rounded-lg border border-white/15 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-mono-code uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditing ? 'CANCEL EDITING' : 'EDIT CREDENTIALS'}</span>
            </button>
          )}

          {isRevealed && (
            <a
              href="/reveal"
              className="px-5 py-2.5 rounded-lg font-cinzel font-bold text-xs uppercase bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-950/40 flex items-center justify-center space-x-2 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>REVEAL PORTAL</span>
            </a>
          )}
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-600 text-emerald-300 text-xs font-mono-code flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {saveErrorMsg && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-600 text-red-300 text-xs font-mono-code flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* REVEAL / ROLE STATUS BANNER */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-red-500" />
            <h3 className="font-cinzel text-lg font-bold text-white uppercase tracking-wider">
              PORTFOLIO ROLE MANDATE
            </h3>
          </div>
          <span className="text-xs font-mono-code uppercase tracking-wider text-zinc-500">
            {isRevealed ? 'STATUS: REVEALED' : 'STATUS: ASSIGNMENT PENDING'}
          </span>
        </div>

        {isRevealed && asg?.portfolio ? (
          <div className="rounded-xl border border-amber-600/60 bg-gradient-to-r from-amber-950/30 via-zinc-900 to-black p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[11px] font-mono-code uppercase text-amber-400 tracking-widest font-bold">
                OFFICIALLY COMMISSIONED ROLE
              </span>
              <h2 className="font-cinzel text-2xl sm:text-4xl font-extrabold text-white">
                {asg.portfolio.name}
              </h2>
              <p className="font-mono-code text-sm text-zinc-300">
                {asg.portfolio.short_description}
              </p>
              <p className="text-xs text-zinc-400 max-w-xl font-sans mt-2">
                {asg.portfolio.description}
              </p>
            </div>

            <div className="flex flex-col items-end space-y-2">
              <div className="px-3 py-1.5 rounded bg-black/80 border border-amber-600/50 text-amber-400 font-mono-code text-xs">
                {asg.preference_rank ? `ALLOCATION: PREFERENCE #${asg.preference_rank}` : 'HIGH COMMAND ALLOCATION'}
              </div>
              <a
                href="/reveal"
                className="inline-flex items-center space-x-2 text-xs font-mono-code text-zinc-400 hover:text-white underline underline-offset-4"
              >
                <span>Replay Cinematic Reveal</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-cinzel text-lg font-bold text-white tracking-wider">
              YOUR ROLE IS BEING PREPARED
            </h4>
            <p className="font-mono-code text-xs text-zinc-400 max-w-md mx-auto">
              Assignments will be calculated and officially unsealed prior to Day 1. Your preferences remain firmly locked.
            </p>
          </div>
        )}
      </div>

      {/* PARTICIPANT CREDENTIALS & PREFERENCES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT 2 COLUMNS: PARTICIPANT / TEAM DETAILS */}
        <div className="lg:col-span-2 space-y-8">
          {/* Participant / Team Dossier Card */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-cinzel text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Users className="w-4 h-4 text-red-500" />
                <span>{isTeam ? 'FRANCHISE SYNDICATE' : 'DELEGATE IDENTIFICATION'}</span>
              </h3>
              <span className="text-[11px] font-mono-code text-zinc-500">
                {isEditing ? 'EDITING MODE ACTIVE' : 'LOCKED PREFERENCES'}
              </span>
            </div>

            {isEditing ? (
              /* Inline Edit Mode */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={editFormData.contactEmail}
                      onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                    />
                  </div>

                  {!isTeam && (
                    <>
                      <div>
                        <label className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={editFormData.fullName}
                          onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-1">
                          USN
                        </label>
                        <input
                          type="text"
                          value={editFormData.usn}
                          onChange={(e) => setEditFormData({ ...editFormData, usn: e.target.value.toUpperCase() })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white uppercase font-mono-code focus:outline-none focus:border-red-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-1">
                          Branch
                        </label>
                        <input
                          type="text"
                          value={editFormData.branch}
                          onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                        />
                      </div>
                    </>
                  )}

                  {isTeam && (
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-1">
                        Team Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.teamName}
                        onChange={(e) => setEditFormData({ ...editFormData, teamName: e.target.value })}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-cinzel font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-lg border border-white/10 text-xs font-mono-code text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveParticipantEdits}
                    className="px-6 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-mono-code font-bold uppercase tracking-wider flex items-center space-x-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Read-only Display Mode */
              <div>
                {!isTeam ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-code">
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                      <span className="text-zinc-500 uppercase block">Full Name</span>
                      <span className="text-sm font-bold text-white mt-0.5 block">{ind?.full_name}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                      <span className="text-zinc-500 uppercase block">USN</span>
                      <span className="text-sm font-bold text-white mt-0.5 block">{ind?.usn}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                      <span className="text-zinc-500 uppercase block">Branch of Study</span>
                      <span className="text-sm font-bold text-zinc-200 mt-0.5 block">{ind?.branch}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                      <span className="text-zinc-500 uppercase block">Year / Contact</span>
                      <span className="text-sm font-bold text-zinc-200 mt-0.5 block">
                        {ind?.year} • {reg.contact_email}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-800/40">
                      <span className="text-zinc-500 uppercase text-[10px] font-mono-code block">
                        FRANCHISE NAME
                      </span>
                      <span className="text-lg font-cinzel font-bold text-amber-400">
                        {team?.team_name}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-zinc-500 uppercase text-[11px] font-mono-code block">
                        SYNDICATE ROSTER ({members?.length || 0} MEMBERS)
                      </span>
                      {members?.map((m, idx) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-lg bg-black/50 border border-white/5 flex items-center justify-between text-xs font-mono-code"
                        >
                          <div>
                            <span className="font-bold text-white block">
                              {m.full_name} {m.is_leader && <span className="text-amber-400 text-[10px] ml-1">[LEAD]</span>}
                            </span>
                            <span className="text-zinc-500 text-[11px]">
                              {m.usn} • {m.branch}
                            </span>
                          </div>
                          <span className="text-zinc-400 text-[11px]">{m.year}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Locked Preferences Dossier */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-cinzel text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Lock className="w-4 h-4 text-red-500" />
                <span>TOP 3 LOCKED PREFERENCES</span>
              </h3>
              <span className="text-[11px] font-mono-code text-red-400 uppercase">
                SEALED BY REGISTRANT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {prefs.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-black/60 border border-white/5 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-mono-code text-red-500 font-bold uppercase tracking-widest block mb-1">
                      PREFERENCE #{p.rank}
                    </span>
                    <h5 className="font-cinzel text-sm font-bold text-white">
                      {p.portfolio?.name || 'Assigned Choice'}
                    </h5>
                    <p className="text-[11px] font-mono-code text-zinc-400 mt-1 line-clamp-2">
                      {p.portfolio?.short_description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT 1 COLUMN: PAYMENT AUDIT & RESUBMISSION */}
        <div className="space-y-8">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-cinzel text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-red-500" />
                <span>PAYMENT AUDIT</span>
              </h3>
              <span className="text-[11px] font-mono-code uppercase text-zinc-400">
                INR CLEARANCE
              </span>
            </div>

            {pay ? (
              <div className="space-y-4 text-xs font-mono-code">
                <div className="p-3 rounded-lg bg-black/50 border border-white/5 flex justify-between items-center">
                  <span className="text-zinc-500">AMOUNT BILLED</span>
                  <span className="text-base font-cinzel font-bold text-white">
                    {formatCurrency(pay.amount)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-black/50 border border-white/5 flex justify-between items-center">
                  <span className="text-zinc-500">CATEGORY TIER</span>
                  <span className="text-zinc-300 font-bold">{pay.pricing_category}</span>
                </div>

                <div className="p-3 rounded-lg bg-black/50 border border-white/5 flex justify-between items-center">
                  <span className="text-zinc-500">UTR / REF</span>
                  <span className="text-zinc-300 uppercase font-bold">{pay.utr}</span>
                </div>

                <div className="p-3 rounded-lg bg-black/50 border border-white/5 flex justify-between items-center">
                  <span className="text-zinc-500">STATUS</span>
                  <span
                    className={`font-bold ${
                      pay.status === 'VERIFIED'
                        ? 'text-emerald-400'
                        : pay.status === 'REJECTED'
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {pay.status}
                  </span>
                </div>

                {pay.screenshot_path && (
                  <div className="pt-2">
                    <span className="text-zinc-500 block mb-2 uppercase text-[10px]">
                      SUBMITTED RECEIPT
                    </span>
                    <a
                      href={pay.screenshot_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group relative overflow-hidden rounded-lg border border-white/10 max-h-36 bg-black"
                    >
                      <img
                        src={pay.screenshot_path}
                        alt="Receipt"
                        className="w-full object-cover max-h-36 opacity-75 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-white space-x-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Receipt</span>
                      </div>
                    </a>
                  </div>
                )}

                {/* If payment rejected, show resubmission panel */}
                {pay.status === 'REJECTED' && (
                  <div className="pt-4 border-t border-red-800/60 space-y-3">
                    <div className="p-3 rounded-lg bg-red-950/60 border border-red-700 text-red-300 text-xs">
                      <p className="font-bold">VERIFICATION FAILED</p>
                      <p className="mt-1 text-[11px]">
                        {pay.rejection_reason || 'Transaction could not be authenticated.'}
                      </p>
                    </div>

                    {!isResubmittingPayment ? (
                      <button
                        type="button"
                        onClick={() => setIsResubmittingPayment(true)}
                        className="w-full py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white font-mono-code text-xs font-bold uppercase tracking-wider"
                      >
                        Resubmit Valid Payment
                      </button>
                    ) : (
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[11px] uppercase text-zinc-400 mb-1">
                            New UTR Reference
                          </label>
                          <input
                            type="text"
                            placeholder="Enter new 12-digit UTR"
                            value={newUtr}
                            onChange={(e) => setNewUtr(e.target.value)}
                            className="w-full bg-black/70 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-red-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] uppercase text-zinc-400 mb-1">
                            New Receipt Screenshot
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotUpload}
                            className="text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-zinc-800 file:text-zinc-300"
                          />
                        </div>

                        <div className="flex space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsResubmittingPayment(false)}
                            className="w-1/2 py-2 rounded border border-white/10 text-xs text-zinc-400"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleResubmitPayment}
                            className="w-1/2 py-2 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-bold"
                          >
                            Submit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 font-mono-code">No payment record attached.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
