import React, { useState } from 'react';
import { FullRegistrationDetail, Payment } from '../../types';
import { formatCurrency } from '../../utils/pricing';
import { dataService } from '../../services/dataService';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search, 
  ExternalLink, 
  X,
  CreditCard,
  Clock,
  ShieldCheck,
  Edit2
} from 'lucide-react';

interface AdminPaymentsProps {
  registrations: FullRegistrationDetail[];
  onRefresh: () => void;
  onVerifyPayment: (paymentId: string) => Promise<void>;
  onRejectPayment: (paymentId: string, reason: string) => Promise<void>;
}

export const AdminPayments: React.FC<AdminPaymentsProps> = ({
  registrations,
  onRefresh,
  onVerifyPayment,
  onRejectPayment,
}) => {
  const [activeFilter, setActiveFilter] = useState<'SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'ALL'>('SUBMITTED');
  const [inspectScreenshotUrl, setInspectScreenshotUrl] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [overrideModalPayment, setOverrideModalPayment] = useState<Payment | null>(null);
  const [overrideAmount, setOverrideAmount] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState<string>('');

  // Collect all payment records
  const paymentRows = registrations
    .filter((r) => r.payment)
    .filter((r) => {
      if (activeFilter === 'ALL') return true;
      return r.payment?.status === activeFilter;
    });

  const handleVerify = async (paymentId: string) => {
    setProcessingId(paymentId);
    try {
      await onVerifyPayment(paymentId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    const reason = prompt('Enter payment rejection / resubmission reason (optional):') || 'UTR mismatch or unreadable receipt';
    setProcessingId(paymentId);
    try {
      await onRejectPayment(paymentId, reason);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveOverride = async () => {
    if (!overrideModalPayment) return;
    try {
      await dataService.overridePaymentAmount(
        overrideModalPayment.id,
        overrideAmount,
        overrideReason || 'Administrative Fee Adjustment'
      );
      setOverrideModalPayment(null);
      setOverrideReason('');
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cinzel text-2xl font-extrabold text-white uppercase tracking-wider">
            PAYMENT AUDIT QUEUE ({paymentRows.length})
          </h2>
          <p className="font-mono-code text-xs text-zinc-400 mt-0.5">
            Manual accreditation & transaction validation.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex rounded-lg bg-zinc-950 p-1 border border-white/10 font-mono-code text-xs">
          {(['SUBMITTED', 'VERIFIED', 'REJECTED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setActiveFilter(st)}
              className={`px-3 py-1.5 rounded-md uppercase transition-colors ${
                activeFilter === st
                  ? 'bg-red-950 text-white font-bold border border-red-700/80'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {st === 'SUBMITTED' ? 'PENDING VERIFICATION' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-zinc-950/80 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs font-mono-code">
          <thead className="border-b border-white/10 bg-black/40 text-zinc-500 uppercase">
            <tr>
              <th className="py-3 px-4">REGISTRATION ID</th>
              <th className="py-3 px-4">PARTICIPANT / SYNDICATE</th>
              <th className="py-3 px-4">ARENA</th>
              <th className="py-3 px-4">AMOUNT</th>
              <th className="py-3 px-4">UTR REFERENCE</th>
              <th className="py-3 px-4">RECEIPT</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-zinc-300">
            {paymentRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-zinc-500">
                  NO PAYMENTS AWAITING VERIFICATION.
                </td>
              </tr>
            ) : (
              paymentRows.map((item) => {
                const reg = item.registration;
                const pay = item.payment!;
                const ind = item.individual;
                const team = item.team;
                const isPending = pay.status === 'SUBMITTED';

                return (
                  <tr key={pay.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-bold text-red-400">
                      {reg.registration_number}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">
                        {ind ? ind.full_name : team?.team_name}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {ind?.usn || `${item.team_members?.length} Members`}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-zinc-300">{item.committee?.short_name}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-white block">{formatCurrency(pay.amount)}</span>
                        {pay.override_amount && (
                          <span className="text-[9px] bg-red-950 text-red-400 border border-red-800 px-1 rounded">
                            OVERRIDDEN
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase">{pay.pricing_category}</span>
                    </td>

                    <td className="py-3 px-4 font-bold text-zinc-200">
                      {pay.utr}
                    </td>

                    <td className="py-3 px-4">
                      {pay.screenshot_path ? (
                        <button
                          type="button"
                          onClick={() => setInspectScreenshotUrl(pay.screenshot_path)}
                          className="px-2.5 py-1 rounded bg-black border border-white/10 hover:border-red-600 text-zinc-300 hover:text-white flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-red-500" />
                          <span>View</span>
                        </button>
                      ) : (
                        <span className="text-zinc-600">None</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          pay.status === 'VERIFIED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : pay.status === 'REJECTED'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {pay.status === 'SUBMITTED' ? 'PENDING' : pay.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              disabled={processingId === pay.id}
                              onClick={() => handleVerify(pay.id)}
                              className="px-3 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-wider transition-colors disabled:opacity-50"
                            >
                              VERIFY
                            </button>
                            <button
                              type="button"
                              disabled={processingId === pay.id}
                              onClick={() => handleReject(pay.id)}
                              className="px-3 py-1.5 rounded bg-red-900 hover:bg-red-800 text-red-200 text-[11px] uppercase tracking-wider transition-colors disabled:opacity-50"
                            >
                              REJECT
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setOverrideModalPayment(pay);
                            setOverrideAmount(pay.amount);
                            setOverrideReason(pay.override_reason || '');
                          }}
                          className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white"
                          title="Override Payable Amount"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Fee Override Modal (Section 13 Pricing Rules) */}
      {overrideModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-950 p-6 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-cinzel text-base font-bold text-white uppercase">
                ADMIN FEE OVERRIDE
              </h3>
              <button
                type="button"
                onClick={() => setOverrideModalPayment(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono-code">
              <div>
                <span className="text-zinc-500 uppercase block">Current Amount</span>
                <span className="text-white font-bold text-base">
                  {formatCurrency(overrideModalPayment.original_amount || overrideModalPayment.amount)}
                </span>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">New Override Amount (INR)</label>
                <input
                  type="number"
                  value={overrideAmount}
                  onChange={(e) => setOverrideAmount(Number(e.target.value))}
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Reason for Adjustment</label>
                <input
                  type="text"
                  placeholder="e.g. Approved Scholarship or Concession"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-black/70 border border-white/10 rounded px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setOverrideModalPayment(null)}
                className="px-4 py-2 rounded border border-white/10 text-xs font-mono-code text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOverride}
                className="px-6 py-2 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-mono-code font-bold uppercase"
              >
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Screenshot Inspector Modal */}
      {inspectScreenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-2xl w-full bg-zinc-950 border border-white/10 rounded-2xl p-6 text-center space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-mono-code text-xs text-zinc-400 uppercase">
                PAYMENT SCREENSHOT RECEIPT INSPECTOR
              </span>
              <button
                type="button"
                onClick={() => setInspectScreenshotUrl(null)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-lg bg-black p-2 flex items-center justify-center">
              <img
                src={inspectScreenshotUrl}
                alt="Receipt Inspection"
                className="max-h-[65vh] object-contain mx-auto"
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setInspectScreenshotUrl(null)}
                className="px-6 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono-code text-white hover:bg-zinc-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
