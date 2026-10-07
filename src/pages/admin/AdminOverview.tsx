import React from 'react';
import { FullRegistrationDetail, Committee } from '../../types';
import { 
  Users, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Shuffle, 
  Sparkles,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

interface AdminOverviewProps {
  registrations: FullRegistrationDetail[];
  committees: Committee[];
  onNavigateTab: (tab: any) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  registrations,
  committees,
  onNavigateTab,
}) => {
  const total = registrations.length;
  const paymentPending = registrations.filter((r) => r.payment?.status === 'SUBMITTED').length;
  const paymentVerified = registrations.filter((r) => r.payment?.status === 'VERIFIED').length;
  const confirmed = registrations.filter((r) => r.registration.status === 'CONFIRMED').length;
  const assigned = registrations.filter((r) => r.registration.assignment_status === 'ASSIGNED').length;
  const revealed = registrations.filter((r) => r.registration.reveal_status === 'REVEALED').length;

  const totalCapacity = committees.reduce((acc, c) => acc + c.capacity, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Editorial Header */}
      <div>
        <h2 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-wider">
          SIMULATION OVERVIEW
        </h2>
        <p className="font-mono-code text-xs text-zinc-400 mt-1">
          High-command operational readiness and live telemetry.
        </p>
      </div>

      {/* METRIC KPI TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registrations */}
        <div 
          onClick={() => onNavigateTab('registrations')}
          className="p-5 rounded-xl border border-white/10 bg-zinc-950/60 hover:border-red-600/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="font-mono-code text-xs uppercase">TOTAL ENTRIES</span>
            <Users className="w-4 h-4 text-red-500" />
          </div>
          <div className="font-mono-code text-3xl font-extrabold text-white">{total}</div>
          <div className="text-[11px] font-mono-code text-zinc-500 mt-1">
            Across 3 active battlegrounds
          </div>
        </div>

        {/* Verification Queue */}
        <div 
          onClick={() => onNavigateTab('payments')}
          className="p-5 rounded-xl border border-amber-900/40 bg-zinc-950/60 hover:border-amber-600/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="font-mono-code text-xs uppercase">PAYMENTS QUEUED</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-mono-code text-3xl font-extrabold text-amber-400">
            {paymentPending}
          </div>
          <div className="text-[11px] font-mono-code text-zinc-500 mt-1">
            Awaiting manual accreditation
          </div>
        </div>

        {/* Confirmed Participants */}
        <div 
          onClick={() => onNavigateTab('registrations')}
          className="p-5 rounded-xl border border-emerald-900/40 bg-zinc-950/60 hover:border-emerald-600/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="font-mono-code text-xs uppercase">CONFIRMED SEATS</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-mono-code text-3xl font-extrabold text-emerald-400">
            {confirmed}
          </div>
          <div className="text-[11px] font-mono-code text-zinc-500 mt-1">
            {totalCapacity > 0 ? `${Math.round((confirmed / totalCapacity) * 100)}% capacity filled` : 'Active'}
          </div>
        </div>

        {/* Assignments / Revealed */}
        <div 
          onClick={() => onNavigateTab('assignments')}
          className="p-5 rounded-xl border border-sky-900/40 bg-zinc-950/60 hover:border-sky-600/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="font-mono-code text-xs uppercase">ROLES ASSIGNED</span>
            <Shuffle className="w-4 h-4 text-sky-400" />
          </div>
          <div className="font-mono-code text-3xl font-extrabold text-sky-400">
            {assigned} / {confirmed}
          </div>
          <div className="text-[11px] font-mono-code text-zinc-500 mt-1">
            {revealed} officially revealed to delegates
          </div>
        </div>
      </div>

      {/* COMMITTEE BREAKDOWN CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-cinzel text-lg font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-red-500" />
            <span>ARENA DEPLOYMENT STATUS</span>
          </h3>
          <span className="text-xs font-mono-code text-zinc-500">
            CAPACITY POOL: {totalCapacity} SEATS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {committees.map((comm) => {
            const commRegs = registrations.filter((r) => r.registration.committee_id === comm.id);
            const commConfirmed = commRegs.filter((r) => r.registration.status === 'CONFIRMED').length;
            const commPending = commRegs.filter((r) => r.registration.status === 'VERIFICATION_PENDING').length;
            const commAssigned = commRegs.filter((r) => r.registration.assignment_status === 'ASSIGNED').length;
            const pct = Math.min(100, Math.round((commConfirmed / comm.capacity) * 100));

            return (
              <div
                key={comm.id}
                className="rounded-xl border border-white/10 bg-zinc-950/70 p-6 space-y-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-400 uppercase">
                    {comm.format}
                  </span>
                  <span className={`text-[10px] font-mono-code uppercase font-bold ${
                    comm.is_open ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {comm.is_open ? 'REGISTRATION OPEN' : 'CLOSED'}
                  </span>
                </div>

                <div>
                  <h4 className="font-cinzel text-lg font-bold text-white">
                    {comm.name}
                  </h4>
                  <p className="text-xs font-mono-code text-zinc-400 mt-0.5 italic">
                    "{comm.hook}"
                  </p>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono-code">
                    <span className="text-zinc-500">OCCUPANCY</span>
                    <span className="text-white font-bold">{commConfirmed} / {comm.capacity}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-center font-mono-code text-[11px]">
                  <div className="p-2 rounded bg-black/40">
                    <div className="text-zinc-500 text-[10px]">TOTAL</div>
                    <div className="font-bold text-white">{commRegs.length}</div>
                  </div>
                  <div className="p-2 rounded bg-black/40">
                    <div className="text-zinc-500 text-[10px]">PENDING</div>
                    <div className="font-bold text-amber-400">{commPending}</div>
                  </div>
                  <div className="p-2 rounded bg-black/40">
                    <div className="text-zinc-500 text-[10px]">ASSIGNED</div>
                    <div className="font-bold text-sky-400">{commAssigned}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
