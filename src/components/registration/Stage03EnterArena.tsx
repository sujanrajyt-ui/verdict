import React, { useState } from 'react';
import { Committee, FeeCategory } from '../../types';
import { resolveParticipantCategory } from '../../utils/pricing';
import { 
  Users, 
  User, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Building2,
  Mail,
  GraduationCap,
  Hash
} from 'lucide-react';

export interface IndividualFormData {
  fullName: string;
  usn: string;
  email: string;
  branch: string;
  year: string;
}

export interface TeamMemberData {
  id: string;
  fullName: string;
  usn: string;
  email: string;
  branch: string;
  year: string;
}

export interface TeamFormData {
  teamName: string;
  leader: IndividualFormData;
  members: TeamMemberData[];
}

interface Stage03EnterArenaProps {
  committee: Committee;
  individualData: IndividualFormData;
  teamData: TeamFormData;
  onUpdateIndividual: (data: IndividualFormData) => void;
  onUpdateTeam: (data: TeamFormData) => void;
  onProceed: () => void;
  onBack: () => void;
}

const COMMON_BRANCHES = [
  'Information Science & Engineering',
  'Computer Science & Engineering',
  'Artificial Intelligence & Machine Learning',
  'Computer Science (Cyber Security)',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology',
  'Other / External Institution',
];

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

export const Stage03EnterArena: React.FC<Stage03EnterArenaProps> = ({
  committee,
  individualData,
  teamData,
  onUpdateIndividual,
  onUpdateTeam,
  onProceed,
  onBack,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isTeam = committee.format === 'TEAM';

  // Real-time branch category determination
  const primaryBranch = isTeam ? teamData.leader.branch : individualData.branch;
  const resolvedCategory = resolveParticipantCategory(primaryBranch);

  const validateIndividual = (data: IndividualFormData, prefix = ''): boolean => {
    const errs: Record<string, string> = {};

    if (!data.fullName.trim()) errs[`${prefix}fullName`] = 'Full Name is required.';
    if (!data.usn.trim()) errs[`${prefix}usn`] = 'USN is required.';
    else if (!/^[0-9][a-zA-Z]{2}[0-9]{2}[a-zA-Z]{2}[0-9]{3}$/i.test(data.usn.trim()) && data.usn.length < 5) {
      errs[`${prefix}usn`] = 'Please enter a valid USN (e.g., 4NM22IS015).';
    }

    if (!data.email.trim()) errs[`${prefix}email`] = 'Event contact email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) {
      errs[`${prefix}email`] = 'Enter a valid email address.';
    }

    if (!data.branch.trim()) errs[`${prefix}branch`] = 'Branch is required.';
    if (!data.year.trim()) errs[`${prefix}year`] = 'Year of study is required.';

    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  const handleValidateAndProceed = () => {
    setErrors({});

    if (!isTeam) {
      const valid = validateIndividual(individualData);
      if (valid) onProceed();
    } else {
      const teamErrs: Record<string, string> = {};
      if (!teamData.teamName.trim()) teamErrs['teamName'] = 'Team Name is required.';

      const leadValid = validateIndividual(teamData.leader, 'lead_');

      // Check team size (1 leader + 1 or 2 members = 2 or 3 total)
      const totalMembers = 1 + teamData.members.length;
      if (totalMembers < 2) {
        teamErrs['teamSize'] = 'IPL requires at least 2 members in a team.';
      } else if (totalMembers > 3) {
        teamErrs['teamSize'] = 'IPL allows a maximum of 3 members.';
      }

      // Validate members
      let membersValid = true;
      teamData.members.forEach((m, idx) => {
        const mValid = validateIndividual(
          {
            fullName: m.fullName,
            usn: m.usn,
            email: m.email,
            branch: m.branch,
            year: m.year,
          },
          `m_${idx}_`
        );
        if (!mValid) membersValid = false;
      });

      // Check for duplicate USNs
      const allUsns = [teamData.leader.usn, ...teamData.members.map((m) => m.usn)]
        .map((u) => u.trim().toUpperCase())
        .filter(Boolean);
      const uniqueUsns = new Set(allUsns);
      if (allUsns.length !== uniqueUsns.size) {
        teamErrs['duplicateUsn'] = 'Each team member must have a unique USN.';
      }

      setErrors((prev) => ({ ...prev, ...teamErrs }));

      if (leadValid && membersValid && Object.keys(teamErrs).length === 0) {
        onProceed();
      }
    }
  };

  const addTeamMember = () => {
    if (teamData.members.length >= 2) return; // Max 2 additional members (3 total)
    const newMember: TeamMemberData = {
      id: 'm-' + Math.random().toString(36).substring(2, 9),
      fullName: '',
      usn: '',
      email: '',
      branch: teamData.leader.branch || COMMON_BRANCHES[0],
      year: teamData.leader.year || YEAR_OPTIONS[2],
    };
    onUpdateTeam({
      ...teamData,
      members: [...teamData.members, newMember],
    });
  };

  const removeTeamMember = (index: number) => {
    const updated = [...teamData.members];
    updated.splice(index, 1);
    onUpdateTeam({
      ...teamData,
      members: updated,
    });
  };

  const updateTeamMember = (index: number, field: keyof TeamMemberData, value: string) => {
    const updated = [...teamData.members];
    updated[index] = { ...updated[index], [field]: value };
    onUpdateTeam({
      ...teamData,
      members: updated,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 animate-fadeIn">
      {/* Editorial Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-950/30 border border-red-800/40 text-red-500 text-xs font-mono-code uppercase tracking-widest mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>STAGE 03 — REGISTRATION DOSSIER</span>
        </div>

        <h1 className="font-cinzel text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase drop-shadow-md">
          ENTER THE ARENA
        </h1>

        <p className="mt-3 font-mono-code text-sm sm:text-base text-zinc-400 max-w-md mx-auto">
          {isTeam
            ? 'Assemble your franchise syndicate (2–3 Members).'
            : 'Register your individual delegate credentials.'}
        </p>
      </div>

      {/* Real-time Category Determination Ribbon */}
      <div className="mb-8 rounded-xl border border-white/10 bg-zinc-950/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 text-left">
          <div className="w-8 h-8 rounded-lg bg-red-950/50 border border-red-800/60 flex items-center justify-center text-red-500 font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono-code text-zinc-400">INSTITUTIONAL TIER RESOLUTION</div>
            <div className="text-sm font-cinzel font-bold text-white flex items-center space-x-2">
              <span>PRICING CATEGORY:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-mono-code ${
                resolvedCategory === 'ISE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-zinc-800 text-zinc-300'
              }`}>
                {resolvedCategory === 'ISE' ? 'ISE STUDENT (SUBSIDIZED)' : 'STANDARD DELEGATE (NON-ISE)'}
              </span>
            </div>
          </div>
        </div>
        <p className="text-[11px] font-mono-code text-zinc-500 max-w-xs text-center sm:text-right">
          Determined dynamically by branch selection. Verified during physical accreditation.
        </p>
      </div>

      {/* INDIVIDUAL FORM (Bollywood / Lok Sabha) */}
      {!isTeam ? (
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 backdrop-blur-sm p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-mono-code uppercase tracking-wider text-zinc-400 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Aditya Shenoy"
                  value={individualData.fullName}
                  onChange={(e) => onUpdateIndividual({ ...individualData, fullName: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
              {errors.fullName && <p className="text-xs text-red-500 mt-1 font-mono-code">{errors.fullName}</p>}
            </div>

            {/* USN */}
            <div>
              <label className="block text-xs font-mono-code uppercase tracking-wider text-zinc-400 mb-2">
                USN (College ID) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 4NM22IS015"
                value={individualData.usn}
                onChange={(e) => onUpdateIndividual({ ...individualData, usn: e.target.value.toUpperCase() })}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-sm text-white uppercase font-mono-code placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors"
              />
              {errors.usn && <p className="text-xs text-red-500 mt-1 font-mono-code">{errors.usn}</p>}
            </div>

            {/* Event Contact Email */}
            <div>
              <label className="block text-xs font-mono-code uppercase tracking-wider text-zinc-400 mb-2">
                Contact Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="aditya@example.com"
                value={individualData.email}
                onChange={(e) => onUpdateIndividual({ ...individualData, email: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors"
              />
              <p className="text-[10px] text-zinc-500 mt-1 font-mono-code">Can differ from Google Auth email.</p>
              {errors.email && <p className="text-xs text-red-500 mt-1 font-mono-code">{errors.email}</p>}
            </div>

            {/* Branch */}
            <div>
              <label className="block text-xs font-mono-code uppercase tracking-wider text-zinc-400 mb-2">
                Branch of Study <span className="text-red-500">*</span>
              </label>
              <select
                value={individualData.branch}
                onChange={(e) => onUpdateIndividual({ ...individualData, branch: e.target.value })}
                className="w-full bg-black/80 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-600 transition-colors"
              >
                <option value="">Select Branch...</option>
                {COMMON_BRANCHES.map((b) => (
                  <option key={b} value={b} className="bg-zinc-950 text-white">
                    {b}
                  </option>
                ))}
              </select>
              {errors.branch && <p className="text-xs text-red-500 mt-1 font-mono-code">{errors.branch}</p>}
            </div>

            {/* Year */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono-code uppercase tracking-wider text-zinc-400 mb-2">
                Year of Study <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {YEAR_OPTIONS.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => onUpdateIndividual({ ...individualData, year: y })}
                    className={`py-2.5 px-3 rounded-lg text-xs font-mono-code border transition-all ${
                      individualData.year === y
                        ? 'bg-red-950/80 border-red-600 text-white font-bold'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white hover:border-zinc-500'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
              {errors.year && <p className="text-xs text-red-500 mt-1 font-mono-code">{errors.year}</p>}
            </div>
          </div>
        </div>
      ) : (
        /* IPL TEAM FORM */
        <div className="space-y-8">
          {/* Team Name */}
          <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-6">
            <label className="block text-xs font-mono-code uppercase tracking-wider text-zinc-400 mb-2">
              Franchise Syndicate Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Deccan Superstrikers"
              value={teamData.teamName}
              onChange={(e) => onUpdateTeam({ ...teamData, teamName: e.target.value })}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-base text-white font-cinzel font-bold placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {errors.teamName && <p className="text-xs text-red-500 mt-1 font-mono-code">{errors.teamName}</p>}
            {errors.teamSize && <p className="text-xs text-red-500 mt-1 font-mono-code">{errors.teamSize}</p>}
            {errors.duplicateUsn && <p className="text-xs text-red-500 mt-1 font-mono-code">{errors.duplicateUsn}</p>}
          </div>

          {/* Member 1: Team Lead */}
          <div className="rounded-xl border border-amber-600/40 bg-zinc-900/30 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-cinzel text-sm font-bold text-amber-400 tracking-wider">
                MEMBER 01 — TEAM LEAD (PRIMARY REGISTRANT)
              </span>
              <span className="text-[10px] font-mono-code bg-amber-950/60 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded">
                PRIMARY CONTACT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="Lead full name"
                  value={teamData.leader.fullName}
                  onChange={(e) =>
                    onUpdateTeam({
                      ...teamData,
                      leader: { ...teamData.leader, fullName: e.target.value },
                    })
                  }
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                {errors.lead_fullName && <p className="text-xs text-red-500 mt-1">{errors.lead_fullName}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-1">USN *</label>
                <input
                  type="text"
                  placeholder="e.g. 4NM22CS001"
                  value={teamData.leader.usn}
                  onChange={(e) =>
                    onUpdateTeam({
                      ...teamData,
                      leader: { ...teamData.leader, usn: e.target.value.toUpperCase() },
                    })
                  }
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white uppercase font-mono-code focus:outline-none focus:border-amber-500"
                />
                {errors.lead_usn && <p className="text-xs text-red-500 mt-1">{errors.lead_usn}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="lead@example.com"
                  value={teamData.leader.email}
                  onChange={(e) =>
                    onUpdateTeam({
                      ...teamData,
                      leader: { ...teamData.leader, email: e.target.value },
                    })
                  }
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                {errors.lead_email && <p className="text-xs text-red-500 mt-1">{errors.lead_email}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-1">Branch *</label>
                <select
                  value={teamData.leader.branch}
                  onChange={(e) =>
                    onUpdateTeam({
                      ...teamData,
                      leader: { ...teamData.leader, branch: e.target.value },
                    })
                  }
                  className="w-full bg-black/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Branch...</option>
                  {COMMON_BRANCHES.map((b) => (
                    <option key={b} value={b} className="bg-zinc-950 text-white">
                      {b}
                    </option>
                  ))}
                </select>
                {errors.lead_branch && <p className="text-xs text-red-500 mt-1">{errors.lead_branch}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-1">Year of Study *</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {YEAR_OPTIONS.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() =>
                        onUpdateTeam({
                          ...teamData,
                          leader: { ...teamData.leader, year: y },
                        })
                      }
                      className={`py-2 px-2 rounded text-xs font-mono-code border ${
                        teamData.leader.year === y
                          ? 'bg-amber-950 border-amber-500 text-white font-bold'
                          : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
                {errors.lead_year && <p className="text-xs text-red-500 mt-1">{errors.lead_year}</p>}
              </div>
            </div>
          </div>

          {/* Additional Team Members */}
          {teamData.members.map((member, idx) => (
            <div key={member.id} className="rounded-xl border border-white/10 bg-zinc-900/30 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="font-cinzel text-sm font-bold text-zinc-300 tracking-wider">
                  MEMBER 0{idx + 2} — SYNDICATE DELEGATE
                </span>
                <button
                  type="button"
                  onClick={() => removeTeamMember(idx)}
                  className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Member full name"
                    value={member.fullName}
                    onChange={(e) => updateTeamMember(idx, 'fullName', e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  />
                  {errors[`m_${idx}_fullName`] && <p className="text-xs text-red-500 mt-1">{errors[`m_${idx}_fullName`]}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-1">USN *</label>
                  <input
                    type="text"
                    placeholder="e.g. 4NM22IS020"
                    value={member.usn}
                    onChange={(e) => updateTeamMember(idx, 'usn', e.target.value.toUpperCase())}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white uppercase font-mono-code focus:outline-none focus:border-red-600"
                  />
                  {errors[`m_${idx}_usn`] && <p className="text-xs text-red-500 mt-1">{errors[`m_${idx}_usn`]}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-1">Email *</label>
                  <input
                    type="email"
                    placeholder="member@example.com"
                    value={member.email}
                    onChange={(e) => updateTeamMember(idx, 'email', e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  />
                  {errors[`m_${idx}_email`] && <p className="text-xs text-red-500 mt-1">{errors[`m_${idx}_email`]}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-1">Branch *</label>
                  <select
                    value={member.branch}
                    onChange={(e) => updateTeamMember(idx, 'branch', e.target.value)}
                    className="w-full bg-black/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="">Select Branch...</option>
                    {COMMON_BRANCHES.map((b) => (
                      <option key={b} value={b} className="bg-zinc-950 text-white">
                        {b}
                      </option>
                    ))}
                  </select>
                  {errors[`m_${idx}_branch`] && <p className="text-xs text-red-500 mt-1">{errors[`m_${idx}_branch`]}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-1">Year of Study *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {YEAR_OPTIONS.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => updateTeamMember(idx, 'year', y)}
                        className={`py-2 px-2 rounded text-xs font-mono-code border ${
                          member.year === y
                            ? 'bg-red-950 border-red-600 text-white font-bold'
                            : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                  {errors[`m_${idx}_year`] && <p className="text-xs text-red-500 mt-1">{errors[`m_${idx}_year`]}</p>}
                </div>
              </div>
            </div>
          ))}

          {/* Add Team Member Button (if under 3 total members) */}
          {teamData.members.length < 2 && (
            <button
              type="button"
              onClick={addTeamMember}
              className="w-full py-4 border border-dashed border-white/20 hover:border-amber-500 rounded-xl bg-zinc-950/40 hover:bg-amber-950/20 text-zinc-400 hover:text-amber-400 text-xs font-mono-code uppercase tracking-wider flex items-center justify-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>ADD TEAM MEMBER ({teamData.members.length + 1}/3 CURRENTLY)</span>
            </button>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg border border-white/10 bg-zinc-900 text-zinc-300 hover:text-white text-xs font-mono-code uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO PREFERENCES</span>
        </button>

        <button
          type="button"
          onClick={handleValidateAndProceed}
          className="w-full sm:w-auto px-10 py-3.5 rounded-lg font-cinzel font-extrabold tracking-[0.2em] text-sm uppercase bg-gradient-to-r from-red-700 via-rose-600 to-red-700 text-white hover:from-red-600 hover:to-rose-600 shadow-xl shadow-red-950/60 ring-1 ring-red-500 cursor-pointer transition-all"
        >
          CONFIRM DOSSIER & PROCEED →
        </button>
      </div>
    </div>
  );
};
