import React from 'react';
import { FullRegistrationDetail } from '../../types';
import { 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

interface RegistrationSuccessModalProps {
  registrationDetail: FullRegistrationDetail;
  onGoToDashboard: () => void;
}

export const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({
  registrationDetail,
  onGoToDashboard,
}) => {
  const [copied, setCopied] = React.useState(false);

  const reg = registrationDetail.registration;
  const comm = registrationDetail.committee;

  const copyId = () => {
    navigator.clipboard.writeText(reg.registration_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl border border-red-600/60 bg-[#09090E] p-6 sm:p-10 text-center shadow-2xl shadow-red-950/80">
        {/* Glow pill */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-950/50 border border-red-600/50 text-red-400 text-xs font-mono-code uppercase tracking-widest mb-6">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          <span>PAYMENT VERIFICATION PENDING</span>
        </div>

        {/* Cinematic Title */}
        <h2 className="font-cinzel text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-wider mb-2">
          REGISTRATION RECEIVED
        </h2>

        <p className="font-sans text-sm sm:text-base text-zinc-300 max-w-md mx-auto leading-relaxed mb-6">
          Thank you for registering for <strong className="text-white">VISTA PRESENTS: THE VERDICT</strong>. Your payment is currently being verified. Your registration will be confirmed soon.
        </p>

        {/* High-Stakes Registration ID Badge */}
        <div className="my-6 p-4 rounded-xl bg-black/80 border border-white/10 flex items-center justify-between">
          <div className="text-left">
            <span className="block text-[10px] font-mono-code uppercase text-zinc-500 tracking-widest">
              OFFICIAL REGISTRATION IDENTIFIER
            </span>
            <span className="font-mono-code text-xl sm:text-2xl font-bold tracking-wider text-red-500">
              {reg.registration_number}
            </span>
          </div>

          <button
            type="button"
            onClick={copyId}
            className="p-2.5 rounded-lg border border-white/10 bg-zinc-900 text-zinc-400 hover:text-white hover:border-red-600/50 transition-colors flex items-center space-x-1.5 text-xs font-mono-code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>

        {/* Arena Summary */}
        <div className="mb-8 p-3 rounded-lg bg-zinc-950/60 border border-white/5 text-xs font-mono-code text-zinc-400 flex items-center justify-between">
          <span>ARENA: <span className="text-white font-bold">{comm?.name}</span></span>
          <span>VENUE: <span className="text-white">APJ BLOCK, NMAMIT</span></span>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={onGoToDashboard}
          className="w-full py-4 rounded-lg font-cinzel font-bold tracking-[0.2em] text-sm uppercase bg-gradient-to-r from-red-700 via-rose-600 to-red-700 text-white hover:from-red-600 hover:to-rose-600 shadow-xl shadow-red-950/60 ring-1 ring-red-500 cursor-pointer flex items-center justify-center space-x-2 transition-all"
        >
          <span>THE ARENA AWAITS — GO TO DASHBOARD</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
