import React, { useState } from 'react';
import { Committee, Portfolio, FullRegistrationDetail } from '../../types';
import { dataService } from '../../services/dataService';
import { 
  Shuffle, 
  RotateCcw, 
  Trash2, 
  Edit, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  X,
  Play
} from 'lucide-react';

interface AdminAssignmentsProps {
  committees: Committee[];
  portfolios: Portfolio[];
  registrations: FullRegistrationDetail[];
  onRefresh: () => void;
}

export const AdminAssignments: React.FC<AdminAssignmentsProps> = ({
  committees,
  portfolios,
  registrations,
  onRefresh,
}) => {
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>(
    committees[0]?.id || ''
  );
  const [assignmentMode, setAssignmentMode] = useState<'AUTO_BALANCED' | 'MANUAL_CAPACITY'>('AUTO_BALANCED');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const [manualModalOpen, setManualModalOpen] = useState<boolean>(false);
  const [selectedRegToAssign, setSelectedRegToAssign] = useState<FullRegistrationDetail | null>(null);
  const [manualPortfolioId, setManualPortfolioId] = useState<string>('');
  const [manualReason, setManualReason] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const activeCommittee = committees.find((c) => c.id === selectedCommitteeId) || committees[0];
  const commRegs = registrations.filter((r) => r.registration.committee_id === selectedCommitteeId);
  const confirmedRegs = commRegs.filter((r) => r.registration.status === 'CONFIRMED');
  const assignedRegs = commRegs.filter((r) => r.registration.assignment_status === 'ASSIGNED');
  const unassignedRegs = confirmedRegs.filter((r) => r.registration.assignment_status === 'UNASSIGNED');

  const commPortfolios = portfolios.filter((p) => p.committee_id === selectedCommitteeId);

  const handleRunAutoAssignment = async () => {
    setIsRunning(true);
    setStatusMsg(null);
    try {
      const res = await dataService.runAutoAssignment(selectedCommitteeId, assignmentMode);
      setStatusMsg({
        text: `Assignment Engine executed successfully (${assignmentMode === 'AUTO_BALANCED' ? 'Balanced Mode' : 'Manual Capacity Mode'}). Allocated ${res.assignedCount} participants.`,
      });
      onRefresh();
    } catch (err: any) {
      setStatusMsg({ text: err?.message || 'Assignment run failed.', isError: true });
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetAssignments = async () => {
    setConfirmResetOpen(false);
    setIsRunning(true);
    try {
      const removed = await dataService.resetAssignments(selectedCommitteeId);
      setStatusMsg({ text: `Reset complete. Cleared ${removed} assignments.` });
      onRefresh();
    } catch (err: any) {
      setStatusMsg({ text: err?.message || 'Reset failed.', isError: true });
    } finally {
      setIsRunning(false);
    }
  };

  const handleManualAssign = async () => {
    if (!selectedRegToAssign || !manualPortfolioId) return;
    try {
      await dataService.manualAssignPortfolio(
        selectedRegToAssign.registration.id,
        manualPortfolioId,
        manualReason || 'Admin Manual Strategic Override'
      );
      setManualModalOpen(false);
      setSelectedRegToAssign(null);
      setManualReason('');
      setStatusMsg({ text: 'Manual assignment executed and logged to audit trail.' });
      onRefresh();
    } catch (err: any) {
      setStatusMsg({ text: err?.message || 'Manual assignment failed.', isError: true });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cinzel text-2xl font-extrabold text-white uppercase tracking-wider">
            PORTFOLIO ALLOCATION ENGINE
          </h2>
          <p className="font-mono-code text-xs text-zinc-400 mt-0.5">
            Algorithmic 3-tier preference matcher with fair random tie-breaking.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={assignmentMode}
            onChange={(e) => setAssignmentMode(e.target.value as any)}
            className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono-code text-zinc-300 focus:outline-none focus:border-red-600"
          >
            <option value="AUTO_BALANCED">Mode: Automatic Balancing</option>
            <option value="MANUAL_CAPACITY">Mode: Manual Capacity Limits</option>
          </select>

          <button
            type="button"
            disabled={isRunning || unassignedRegs.length === 0}
            onClick={handleRunAutoAssignment}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-mono-code text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-red-950/60 transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>{isRunning ? 'RUNNING ENGINE...' : 'RUN AUTO ASSIGNMENT'}</span>
          </button>

          <button
            type="button"
            disabled={isRunning || assignedRegs.length === 0}
            onClick={() => setConfirmResetOpen(true)}
            className="px-4 py-2.5 rounded-lg border border-red-900/60 bg-red-950/20 hover:bg-red-900/40 text-red-400 text-xs font-mono-code font-bold uppercase tracking-wider flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-mono-code flex items-center space-x-2 ${
            statusMsg.isError
              ? 'bg-red-950/80 border border-red-700 text-red-300'
              : 'bg-emerald-950/80 border border-emerald-700 text-emerald-300'
          }`}
        >
          {statusMsg.isError ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Committee Selector */}
      <div className="flex rounded-lg bg-zinc-950 p-1 border border-white/10 font-mono-code text-xs overflow-x-auto">
        {committees.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedCommitteeId(c.id)}
            className={`px-4 py-2 rounded-md uppercase whitespace-nowrap transition-colors ${
              selectedCommitteeId === c.id
                ? 'bg-red-950 text-white font-bold border border-red-700/80'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* STATS TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
          <span className="text-[10px] font-mono-code uppercase text-zinc-500 block">CONFIRMED ELIGIBLE</span>
          <span className="text-2xl font-mono-code font-bold text-white">{confirmedRegs.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-950 border border-sky-900/40">
          <span className="text-[10px] font-mono-code uppercase text-zinc-500 block">ROLES ASSIGNED</span>
          <span className="text-2xl font-mono-code font-bold text-sky-400">{assignedRegs.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-950 border border-amber-900/40">
          <span className="text-[10px] font-mono-code uppercase text-zinc-500 block">PENDING ALLOCATION</span>
          <span className="text-2xl font-mono-code font-bold text-amber-400">{unassignedRegs.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-900/40">
          <span className="text-[10px] font-mono-code uppercase text-zinc-500 block">ARENA CAPACITY</span>
          <span className="text-2xl font-mono-code font-bold text-emerald-400">{activeCommittee?.capacity}</span>
        </div>
      </div>

      {/* DELEGATE ROSTER ASSIGNMENT TABLE */}
      <div className="rounded-xl border border-white/10 bg-zinc-950/80 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs font-mono-code">
          <thead className="border-b border-white/10 bg-black/40 text-zinc-500 uppercase">
            <tr>
              <th className="py-3 px-4">REGISTRATION ID</th>
              <th className="py-3 px-4">PARTICIPANT / SYNDICATE</th>
              <th className="py-3 px-4">PREFERENCE 1</th>
              <th className="py-3 px-4">PREFERENCE 2</th>
              <th className="py-3 px-4">PREFERENCE 3</th>
              <th className="py-3 px-4">ASSIGNED PORTFOLIO</th>
              <th className="py-3 px-4 text-right">OVERRIDE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-zinc-300">
            {confirmedRegs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500">
                  NO CONFIRMED PARTICIPANTS YET IN THIS ARENA.
                </td>
              </tr>
            ) : (
              confirmedRegs.map((item) => {
                const reg = item.registration;
                const asg = item.assignment;
                const ind = item.individual;
                const team = item.team;

                return (
                  <tr key={reg.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-bold text-red-400">
                      {reg.registration_number}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">
                        {ind ? ind.full_name : team?.team_name}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-zinc-400">
                      {item.preferences[0]?.portfolio?.name || '—'}
                    </td>

                    <td className="py-3 px-4 text-zinc-400">
                      {item.preferences[1]?.portfolio?.name || '—'}
                    </td>

                    <td className="py-3 px-4 text-zinc-400">
                      {item.preferences[2]?.portfolio?.name || '—'}
                    </td>

                    <td className="py-3 px-4">
                      {asg?.portfolio ? (
                        <div>
                          <span className="font-bold text-emerald-400 font-cinzel block">
                            {asg.portfolio.name}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {asg.preference_rank ? `Pref #${asg.preference_rank}` : 'Fallback / Manual'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-500 font-bold">UNASSIGNED</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRegToAssign(item);
                          setManualPortfolioId(asg?.portfolio_id || commPortfolios[0]?.id || '');
                          setManualModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white"
                      >
                        Override
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CONFIRM RESET DIALOG */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-red-800 bg-zinc-950 p-6 space-y-4 text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="font-cinzel text-xl font-bold text-white uppercase">
              CONFIRM RESET OF ALL ASSIGNMENTS?
            </h3>
            <p className="font-mono-code text-xs text-zinc-300">
              This action will purge all current portfolio assignments and return all participants in <strong className="text-white">{activeCommittee.name}</strong> to UNASSIGNED state.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="py-2.5 rounded border border-white/10 text-xs font-mono-code text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAssignments}
                className="py-2.5 rounded bg-red-700 hover:bg-red-600 text-white font-mono-code text-xs font-bold uppercase"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL OVERRIDE MODAL */}
      {manualModalOpen && selectedRegToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-950 p-6 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-cinzel text-base font-bold text-white uppercase">
                MANUAL PORTFOLIO OVERRIDE
              </h3>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono-code">
              <div>
                <span className="text-zinc-500 uppercase block">Participant</span>
                <span className="text-white font-bold text-sm">
                  {selectedRegToAssign.individual?.full_name || selectedRegToAssign.team?.team_name} ({selectedRegToAssign.registration.registration_number})
                </span>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Target Portfolio</label>
                <select
                  value={manualPortfolioId}
                  onChange={(e) => setManualPortfolioId(e.target.value)}
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white"
                >
                  {commPortfolios.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.capacity} slots)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Override Reason / Audit Note</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Speaker or Special Committee Rebalance"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="px-4 py-2 rounded border border-white/10 text-xs font-mono-code text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualAssign}
                className="px-6 py-2 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-mono-code font-bold uppercase"
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
