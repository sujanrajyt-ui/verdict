import React, { useState } from 'react';
import { FullRegistrationDetail, Committee } from '../../types';
import { formatCurrency } from '../../utils/pricing';
import { 
  Search, 
  Filter, 
  Eye, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  Lock, 
  CreditCard,
  Calendar,
  ExternalLink
} from 'lucide-react';

interface AdminRegistrationsProps {
  registrations: FullRegistrationDetail[];
  committees: Committee[];
  onRefresh: () => void;
  onVerifyPayment: (paymentId: string) => Promise<void>;
  onRejectPayment: (paymentId: string, reason: string) => Promise<void>;
}

export const AdminRegistrations: React.FC<AdminRegistrationsProps> = ({
  registrations,
  committees,
  onRefresh,
  onVerifyPayment,
  onRejectPayment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommitteeFilter, setSelectedCommitteeFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [activeDrawerDetail, setActiveDrawerDetail] = useState<FullRegistrationDetail | null>(null);

  // Filtered registrations
  const filtered = registrations.filter((item) => {
    const reg = item.registration;
    const ind = item.individual;
    const team = item.team;
    const pay = item.payment;

    // Committee filter
    if (selectedCommitteeFilter !== 'ALL' && reg.committee_id !== selectedCommitteeFilter) {
      return false;
    }

    // Status filter
    if (selectedStatusFilter !== 'ALL' && reg.status !== selectedStatusFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = reg.registration_number.toLowerCase().includes(q);
      const matchName = ind?.full_name.toLowerCase().includes(q) || team?.team_name.toLowerCase().includes(q);
      const matchUsn = ind?.usn.toLowerCase().includes(q) || item.team_members?.some((m) => m.usn.toLowerCase().includes(q));
      const matchEmail = reg.contact_email.toLowerCase().includes(q);
      const matchUtr = pay?.utr.toLowerCase().includes(q);

      if (!matchId && !matchName && !matchUsn && !matchEmail && !matchUtr) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cinzel text-2xl font-extrabold text-white uppercase tracking-wider">
            REGISTRATION DOSSIERS ({filtered.length})
          </h2>
          <p className="font-mono-code text-xs text-zinc-400 mt-0.5">
            Complete database of individual and syndicate submissions.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl border border-white/10 bg-zinc-950/60 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, name, USN, email, or UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs font-mono-code text-white placeholder-zinc-600 focus:outline-none focus:border-red-600"
          />
        </div>

        {/* Committee Filter */}
        <select
          value={selectedCommitteeFilter}
          onChange={(e) => setSelectedCommitteeFilter(e.target.value)}
          className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono-code text-zinc-300 focus:outline-none focus:border-red-600"
        >
          <option value="ALL">All Arenas</option>
          {committees.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatusFilter}
          onChange={(e) => setSelectedStatusFilter(e.target.value)}
          className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono-code text-zinc-300 focus:outline-none focus:border-red-600"
        >
          <option value="ALL">All Statuses</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="VERIFICATION_PENDING">VERIFICATION PENDING</option>
          <option value="RESUBMISSION_REQUIRED">RESUBMISSION REQUIRED</option>
          <option value="DRAFT">DRAFT</option>
        </select>
      </div>

      {/* Registrations Table */}
      <div className="rounded-xl border border-white/10 bg-zinc-950/80 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs font-mono-code">
          <thead className="border-b border-white/10 bg-black/40 text-zinc-500 uppercase">
            <tr>
              <th className="py-3 px-4">CLEARANCE ID</th>
              <th className="py-3 px-4">PARTICIPANT / TEAM</th>
              <th className="py-3 px-4">ARENA</th>
              <th className="py-3 px-4">TIER & FEE</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4">ASSIGNMENT</th>
              <th className="py-3 px-4 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-zinc-300">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500">
                  NO ENTRIES YET.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const reg = item.registration;
                const ind = item.individual;
                const team = item.team;
                const comm = item.committee;
                const pay = item.payment;
                const asg = item.assignment;

                return (
                  <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-bold text-red-400">
                      {reg.registration_number}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-white">
                        {ind ? ind.full_name : team?.team_name}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {ind ? `${ind.usn} • ${ind.branch}` : `${item.team_members?.length} Syndicate Members`}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-zinc-300">{comm?.short_name}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-white font-bold">{formatCurrency(pay?.amount || 0)}</div>
                      <div className="text-[10px] text-zinc-500 uppercase">{pay?.pricing_category}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          reg.status === 'CONFIRMED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : reg.status === 'RESUBMISSION_REQUIRED'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {reg.status}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {asg?.portfolio ? (
                        <div>
                          <span className="text-white font-semibold">{asg.portfolio.name}</span>
                          <span className="block text-[10px] text-zinc-500">
                            {asg.preference_rank ? `Rank #${asg.preference_rank}` : 'Manual/Fallback'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-600">UNASSIGNED</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveDrawerDetail(item)}
                        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                        title="View Full Dossier"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* DETAILED REGISTRATION DRAWER / MODAL */}
      {activeDrawerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl h-full bg-[#0C0C12] border-l border-white/10 p-6 sm:p-8 overflow-y-auto space-y-6">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono-code uppercase text-zinc-500">
                  DOSSIER INSPECTION
                </span>
                <h3 className="font-mono-code text-2xl font-bold text-white">
                  {activeDrawerDetail.registration.registration_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawerDetail(null)}
                className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Battle Info */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-2 text-xs font-mono-code">
              <div className="flex justify-between">
                <span className="text-zinc-500">ARENA</span>
                <span className="text-white font-bold">{activeDrawerDetail.committee?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">FORMAT</span>
                <span className="text-zinc-300">{activeDrawerDetail.registration.registration_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">CONTACT EMAIL</span>
                <span className="text-zinc-300">{activeDrawerDetail.registration.contact_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">SUBMITTED ON</span>
                <span className="text-zinc-400">
                  {new Date(activeDrawerDetail.registration.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Participant / IPL Team Breakdown */}
            <div className="space-y-3">
              <h4 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider">
                {activeDrawerDetail.registration.registration_type === 'TEAM'
                  ? `FRANCHISE: ${activeDrawerDetail.team?.team_name}`
                  : 'DELEGATE DOSSIER'}
              </h4>

              {activeDrawerDetail.registration.registration_type === 'INDIVIDUAL' ? (
                <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-2 text-xs font-mono-code">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">FULL NAME</span>
                    <span className="text-white font-bold">{activeDrawerDetail.individual?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">USN</span>
                    <span className="text-white font-bold">{activeDrawerDetail.individual?.usn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">BRANCH</span>
                    <span className="text-zinc-300">{activeDrawerDetail.individual?.branch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">YEAR</span>
                    <span className="text-zinc-300">{activeDrawerDetail.individual?.year}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeDrawerDetail.team_members?.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-lg bg-black/50 border border-white/5 text-xs font-mono-code flex justify-between items-center"
                    >
                      <div>
                        <span className="text-white font-bold block">
                          {m.full_name} {m.is_leader && <span className="text-amber-400">[LEAD]</span>}
                        </span>
                        <span className="text-zinc-500 text-[11px]">{m.usn} • {m.branch}</span>
                      </div>
                      <span className="text-zinc-400 text-[11px]">{m.year}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top 3 Preferences */}
            <div className="space-y-3">
              <h4 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider">
                RANKED PREFERENCES (LOCKED)
              </h4>
              <div className="grid grid-cols-3 gap-2 text-left">
                {activeDrawerDetail.preferences.map((p) => (
                  <div key={p.id} className="p-3 rounded-lg bg-black/60 border border-white/5">
                    <span className="text-[10px] font-mono-code text-red-500 block font-bold">
                      RANK #{p.rank}
                    </span>
                    <span className="text-xs font-cinzel font-bold text-white block mt-1">
                      {p.portfolio?.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Audit Info */}
            {activeDrawerDetail.payment && (
              <div className="space-y-3">
                <h4 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider">
                  PAYMENT CLEARANCE
                </h4>
                <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-3 text-xs font-mono-code">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">AMOUNT PAID</span>
                    <span className="text-white font-bold">
                      {formatCurrency(activeDrawerDetail.payment.amount)} ({activeDrawerDetail.payment.pricing_category})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">UTR REFERENCE</span>
                    <span className="text-white font-bold">{activeDrawerDetail.payment.utr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">PAYMENT STATUS</span>
                    <span className="text-amber-400 font-bold">{activeDrawerDetail.payment.status}</span>
                  </div>

                  {activeDrawerDetail.payment.screenshot_path && (
                    <div className="pt-2">
                      <span className="text-zinc-500 block mb-2 text-[10px] uppercase">
                        RECEIPT SCREENSHOT
                      </span>
                      <a
                        href={activeDrawerDetail.payment.screenshot_path}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg overflow-hidden border border-white/10 max-h-48"
                      >
                        <img
                          src={activeDrawerDetail.payment.screenshot_path}
                          alt="Screenshot"
                          className="w-full object-contain max-h-48"
                        />
                      </a>
                    </div>
                  )}

                  {/* Verification Actions if still submitted */}
                  {activeDrawerDetail.payment.status === 'SUBMITTED' && (
                    <div className="pt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          await onVerifyPayment(activeDrawerDetail.payment!.id);
                          setActiveDrawerDetail(null);
                        }}
                        className="flex-1 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold uppercase text-xs tracking-wider"
                      >
                        VERIFY & CONFIRM
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const reason = prompt('Enter rejection reason:') || 'Payment mismatch';
                          await onRejectPayment(activeDrawerDetail.payment!.id, reason);
                          setActiveDrawerDetail(null);
                        }}
                        className="flex-1 py-2.5 rounded-lg bg-red-800 hover:bg-red-700 text-white font-bold uppercase text-xs tracking-wider"
                      >
                        REJECT PAYMENT
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
