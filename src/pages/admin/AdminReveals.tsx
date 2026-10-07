import React, { useState } from 'react';
import { Committee, FullRegistrationDetail } from '../../types';
import { dataService } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';
import { 
  Sparkles, 
  Eye, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  Layers,
  Send
} from 'lucide-react';

interface AdminRevealsProps {
  committees: Committee[];
  registrations: FullRegistrationDetail[];
  onRefresh: () => void;
}

export const AdminReveals: React.FC<AdminRevealsProps> = ({
  committees,
  registrations,
  onRefresh,
}) => {
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>(
    committees[0]?.id || ''
  );
  const [revealMode, setRevealMode] = useState<'CINEMATIC' | 'SIMPLE'>('CINEMATIC');
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const activeCommittee = committees.find((c) => c.id === selectedCommitteeId) || committees[0];
  const commRegs = registrations.filter((r) => r.registration.committee_id === selectedCommitteeId);
  const assignedRegs = commRegs.filter((r) => r.registration.assignment_status === 'ASSIGNED');
  const revealedRegs = commRegs.filter((r) => r.registration.reveal_status === 'REVEALED');
  const hiddenRegs = assignedRegs.filter((r) => r.registration.reveal_status === 'HIDDEN');

  const handleRevealIndividual = async (regId: string) => {
    setIsProcessing(true);
    try {
      await dataService.revealAssignment(regId, revealMode);
      const reg = registrations.find((r) => r.registration.id === regId);
      if (reg) {
        notificationService.sendEmail({
          toEmail: reg.registration.contact_email,
          recipientName: reg.individual?.full_name || reg.team?.team_name || 'Delegate',
          registrationNumber: reg.registration.registration_number,
          committeeName: activeCommittee.name,
          portfolioName: reg.assignment?.portfolio?.name,
          type: 'PORTFOLIO_REVEALED',
        });
      }
      setFeedbackMsg('Portfolio role unsealed for participant.');
      onRefresh();
    } catch (e: any) {
      setFeedbackMsg(e?.message || 'Reveal failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkRevealCommittee = async () => {
    setConfirmBulkOpen(false);
    setIsProcessing(true);
    try {
      const count = await dataService.revealCommittee(selectedCommitteeId, revealMode);
      setFeedbackMsg(`Bulk reveal complete. Unsealed ${count} participant dossiers.`);
      onRefresh();
    } catch (e: any) {
      setFeedbackMsg(e?.message || 'Bulk reveal failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cinzel text-2xl font-extrabold text-white uppercase tracking-wider">
            REVEAL COMMAND CENTER
          </h2>
          <p className="font-mono-code text-xs text-zinc-400 mt-0.5">
            Control portfolio declassification across public dashboards and reveal portals.
          </p>
        </div>

        {/* Global Bulk Action */}
        <div className="flex items-center space-x-3">
          <select
            value={revealMode}
            onChange={(e) => setRevealMode(e.target.value as any)}
            className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono-code text-zinc-300 focus:outline-none focus:border-red-600"
          >
            <option value="CINEMATIC">Mode: Cinematic Suspense</option>
            <option value="SIMPLE">Mode: Instant Reveal</option>
          </select>

          <button
            type="button"
            disabled={isProcessing || hiddenRegs.length === 0}
            onClick={() => setConfirmBulkOpen(true)}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-mono-code text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-amber-950/60 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>REVEAL ENTIRE COMMITTEE</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-mono-code flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>{feedbackMsg}</span>
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
                ? 'bg-amber-950 text-white font-bold border border-amber-600/80'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* REVEAL TELEMETRY TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
          <span className="text-[10px] font-mono-code uppercase text-zinc-500 block">ASSIGNED ROLES</span>
          <span className="text-2xl font-mono-code font-bold text-white">{assignedRegs.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-900/40">
          <span className="text-[10px] font-mono-code uppercase text-zinc-500 block">PUBLICLY REVEALED</span>
          <span className="text-2xl font-mono-code font-bold text-emerald-400">{revealedRegs.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-950 border border-amber-900/40">
          <span className="text-[10px] font-mono-code uppercase text-zinc-500 block">STILL CLASSIFIED</span>
          <span className="text-2xl font-mono-code font-bold text-amber-400">{hiddenRegs.length}</span>
        </div>
      </div>

      {/* PARTICIPANT REVEAL TABLE */}
      <div className="rounded-xl border border-white/10 bg-zinc-950/80 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs font-mono-code">
          <thead className="border-b border-white/10 bg-black/40 text-zinc-500 uppercase">
            <tr>
              <th className="py-3 px-4">CLEARANCE ID</th>
              <th className="py-3 px-4">PARTICIPANT / SYNDICATE</th>
              <th className="py-3 px-4">ASSIGNED PORTFOLIO</th>
              <th className="py-3 px-4">REVEAL STATUS</th>
              <th className="py-3 px-4 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-zinc-300">
            {assignedRegs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-500">
                  NOTHING HAS BEEN REVEALED YET. (RUN ASSIGNMENTS FIRST)
                </td>
              </tr>
            ) : (
              assignedRegs.map((item) => {
                const reg = item.registration;
                const asg = item.assignment;
                const isRevealed = reg.reveal_status === 'REVEALED';

                return (
                  <tr key={reg.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-bold text-red-400">
                      {reg.registration_number}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">
                        {item.individual?.full_name || item.team?.team_name}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-cinzel font-bold text-white">
                      {asg?.portfolio?.name}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isRevealed
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {reg.reveal_status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {!isRevealed ? (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRevealIndividual(reg.id)}
                          className="px-3 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white font-bold text-[11px] uppercase tracking-wider"
                        >
                          Unseal Role
                        </button>
                      ) : (
                        <span className="text-zinc-600 text-[11px]">Unsealed</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CONFIRM BULK REVEAL MODAL */}
      {confirmBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-amber-600 bg-zinc-950 p-6 space-y-4 text-center">
            <Sparkles className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="font-cinzel text-xl font-bold text-white uppercase">
              CONFIRM BULK REVEAL FOR {activeCommittee.name}?
            </h3>
            <p className="font-mono-code text-xs text-zinc-300">
              This will instantaneously unseal portfolio roles for {hiddenRegs.length} assigned participants in {activeCommittee.name}.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmBulkOpen(false)}
                className="py-2.5 rounded border border-white/10 text-xs font-mono-code text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkRevealCommittee}
                className="py-2.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-mono-code text-xs font-bold uppercase"
              >
                Confirm Reveal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
