import React, { useState } from 'react';
import { FullRegistrationDetail, Committee } from '../../types';
import { exportService } from '../../services/exportService';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Users, 
  CreditCard, 
  Layers, 
  Award,
  CheckCircle2
} from 'lucide-react';

interface AdminExportsProps {
  registrations: FullRegistrationDetail[];
  committees: Committee[];
}

export const AdminExports: React.FC<AdminExportsProps> = ({
  registrations,
  committees,
}) => {
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cinzel text-2xl font-extrabold text-white uppercase tracking-wider">
            DATA EXPORT ARCHIVES
          </h2>
          <p className="font-mono-code text-xs text-zinc-400 mt-0.5">
            Download production-ready spreadsheets and ledgers in Excel or CSV.
          </p>
        </div>

        {/* Format Selector */}
        <div className="flex rounded-lg bg-zinc-950 p-1 border border-white/10 font-mono-code text-xs">
          <button
            type="button"
            onClick={() => setFormat('xlsx')}
            className={`px-3 py-1.5 rounded-md uppercase transition-colors flex items-center space-x-1.5 ${
              format === 'xlsx'
                ? 'bg-emerald-950 text-white font-bold border border-emerald-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => setFormat('csv')}
            className={`px-3 py-1.5 rounded-md uppercase transition-colors flex items-center space-x-1.5 ${
              format === 'csv'
                ? 'bg-zinc-800 text-white font-bold border border-zinc-600'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CSV (.csv)</span>
          </button>
        </div>
      </div>

      {/* EXPORT TILES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Master Sheet */}
        <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-red-500 mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-cinzel text-lg font-bold text-white">ALL REGISTRATIONS</h4>
            <p className="text-xs font-mono-code text-zinc-400 mt-1">
              Complete master dataset including all statuses, draft records, payment states, and contact info.
            </p>
            <div className="text-[11px] font-mono-code text-zinc-500 mt-3">
              COUNT: {registrations.length} ROWS
            </div>
          </div>
          <button
            type="button"
            onClick={() => exportService.exportAllRegistrations(registrations, format)}
            className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-mono-code text-xs uppercase flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT MASTER SHEET</span>
          </button>
        </div>

        {/* Confirmed Participants */}
        <div className="rounded-xl border border-emerald-900/40 bg-zinc-950/70 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-950/40 border border-emerald-700/60 flex items-center justify-center text-emerald-400 mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="font-cinzel text-lg font-bold text-white">CONFIRMED DELEGATES</h4>
            <p className="text-xs font-mono-code text-zinc-400 mt-1">
              Verified entries cleared for venue admission, badge printing, and committee seating.
            </p>
            <div className="text-[11px] font-mono-code text-zinc-500 mt-3">
              COUNT: {registrations.filter((r) => r.registration.status === 'CONFIRMED').length} ROWS
            </div>
          </div>
          <button
            type="button"
            onClick={() => exportService.exportConfirmedParticipants(registrations, format)}
            className="w-full py-2.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-mono-code text-xs uppercase flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CONFIRMED ROSTER</span>
          </button>
        </div>

        {/* Payment Ledger */}
        <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-amber-500 mb-3">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="font-cinzel text-lg font-bold text-white">PAYMENT & UTR LEDGER</h4>
            <p className="text-xs font-mono-code text-zinc-400 mt-1">
              Financial ledger containing UTR references, category tiers, billed fees, and audit timestamps.
            </p>
            <div className="text-[11px] font-mono-code text-zinc-500 mt-3">
              COUNT: {registrations.filter((r) => r.payment).length} RECORDS
            </div>
          </div>
          <button
            type="button"
            onClick={() => exportService.exportPayments(registrations, format)}
            className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-mono-code text-xs uppercase flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT PAYMENT LEDGER</span>
          </button>
        </div>

        {/* Portfolio Assignments */}
        <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-sky-400 mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-cinzel text-lg font-bold text-white">PORTFOLIO ASSIGNMENTS</h4>
            <p className="text-xs font-mono-code text-zinc-400 mt-1">
              Allocated roles, preference satisfaction ranks (1, 2, 3 or manual fallback), and reveal states.
            </p>
            <div className="text-[11px] font-mono-code text-zinc-500 mt-3">
              COUNT: {registrations.filter((r) => r.assignment).length} ASSIGNMENTS
            </div>
          </div>
          <button
            type="button"
            onClick={() => exportService.exportAssignments(registrations, format)}
            className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-mono-code text-xs uppercase flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT ASSIGNMENTS</span>
          </button>
        </div>

        {/* IPL Franchise Teams */}
        <div className="rounded-xl border border-amber-900/40 bg-zinc-950/70 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-amber-950/40 border border-amber-700/60 flex items-center justify-center text-amber-400 mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-cinzel text-lg font-bold text-white">IPL FRANCHISE TEAMS</h4>
            <p className="text-xs font-mono-code text-zinc-400 mt-1">
              Detailed member rosters for IPL Mega Auction 2027 with all 2–3 member USNs and lead flags.
            </p>
            <div className="text-[11px] font-mono-code text-zinc-500 mt-3">
              COUNT: {registrations.filter((r) => r.registration.registration_type === 'TEAM').length} TEAMS
            </div>
          </div>
          <button
            type="button"
            onClick={() => exportService.exportIPLTeams(registrations, format)}
            className="w-full py-2.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-700/60 text-amber-300 font-mono-code text-xs uppercase flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT IPL ROSTERS</span>
          </button>
        </div>

        {/* Individual Committee Exports */}
        {committees.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-white/10 bg-zinc-950/70 p-6 flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-cinzel text-base font-bold text-white">{c.name}</h4>
              <p className="text-xs font-mono-code text-zinc-400 mt-1">
                Filter and export delegates dedicated exclusively to {c.short_name}.
              </p>
              <div className="text-[11px] font-mono-code text-zinc-500 mt-3">
                COUNT: {registrations.filter((r) => r.registration.committee_id === c.id).length} ROWS
              </div>
            </div>
            <button
              type="button"
              onClick={() => exportService.exportByCommittee(registrations, c.slug, c.name, format)}
              className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-mono-code text-xs uppercase flex items-center justify-center space-x-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT {c.short_name}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
