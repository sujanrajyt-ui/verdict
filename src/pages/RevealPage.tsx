import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { FullRegistrationDetail } from '../types';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Award, 
  Lock, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Volume2, 
  VolumeX,
  Share2,
  RefreshCw
} from 'lucide-react';

export const RevealPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [registrationDetail, setRegistrationDetail] = useState<FullRegistrationDetail | null>(null);

  // Cinematic sequence stages: 'IDLE' | 'SUSPENSE_1' | 'SUSPENSE_2' | 'REVEALED'
  const [sequenceStage, setSequenceStage] = useState<'IDLE' | 'SUSPENSE_1' | 'SUSPENSE_2' | 'REVEALED'>('IDLE');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  useEffect(() => {
    const fetchReg = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const reg = await dataService.getRegistrationForUser(user.auth_user_id);
        setRegistrationDetail(reg);
        if (reg?.reveal?.mode === 'SIMPLE') {
          setSequenceStage('REVEALED');
        }
      } catch (err) {
        console.error('Error fetching reveal data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReg();
  }, [user]);

  const playSynthesizedSuspense = () => {
    if (!audioEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(130, ctx.currentTime + 3);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 3.5);
    } catch {
      // Audio fallback
    }
  };

  const triggerRevealSequence = () => {
    setSequenceStage('SUSPENSE_1');
    playSynthesizedSuspense();

    setTimeout(() => {
      setSequenceStage('SUSPENSE_2');
    }, 1800);

    setTimeout(() => {
      setSequenceStage('REVEALED');
      // Fire confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#DC2626', '#F59E0B', '#FFFFFF', '#991B1B'],
        });
      } catch {
        // Confetti fallback
      }
    }, 3800);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
        <p className="font-mono-code text-xs text-zinc-400 tracking-widest uppercase">
          CONTACTING THE HIGH COMMAND ARCHIVES...
        </p>
      </div>
    );
  }

  if (!registrationDetail) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <h2 className="font-cinzel text-3xl font-bold text-white">NO PARTICIPANT DETECTED</h2>
        <p className="font-mono-code text-sm text-zinc-400">
          Authenticate or register to access the reveal portal.
        </p>
        <a
          href="/register"
          className="inline-block px-8 py-3 rounded-lg bg-red-700 text-white font-cinzel text-xs font-bold uppercase tracking-wider"
        >
          REGISTER NOW
        </a>
      </div>
    );
  }

  const { registration: reg, committee: comm, individual: ind, team, assignment: asg } = registrationDetail;
  const isRevealedByAdmin = reg.reveal_status === 'REVEALED' && Boolean(asg?.portfolio);

  // If Admin has NOT yet revealed the portfolio:
  if (!isRevealedByAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center mx-auto text-zinc-600">
          <Lock className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 text-xs font-mono-code uppercase tracking-widest">
          <span>CLASSIFIED MANDATE</span>
        </div>

        <h1 className="font-cinzel text-3xl sm:text-5xl font-black text-white uppercase tracking-wider">
          ASSIGNMENT PENDING
        </h1>

        <p className="font-mono-code text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
          The high command is calculating portfolio allocations for <strong className="text-white">{comm?.name}</strong>. Dossiers will be unsealed when the reveal window commences.
        </p>

        <div className="pt-4">
          <a
            href="/dashboard"
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-lg border border-white/15 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-mono-code uppercase tracking-wider"
          >
            <span>RETURN TO DASHBOARD</span>
          </a>
        </div>
      </div>
    );
  }

  // CINEMATIC SUSPENSE SEQUENCE
  if (sequenceStage === 'SUSPENSE_1') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="w-20 h-20 rounded-full border border-red-600/40 flex items-center justify-center animate-pulse mb-6">
          <div className="w-8 h-8 rounded-full bg-red-600/80 animate-ping" />
        </div>

        <h3 className="font-mono-code text-xs text-red-500 uppercase tracking-widest mb-2">
          HIGH COMMAND ARCHIVES // CLEARANCE LEVEL ALPHA
        </h3>

        <h1 className="font-cinzel text-2xl sm:text-4xl font-extrabold text-white tracking-widest uppercase">
          DECRYPTING SIMULATION MANDATE...
        </h1>

        <p className="font-mono-code text-xs text-zinc-500 mt-4 tracking-wider">
          IDENTIFIER: {reg.registration_number}
        </p>
      </div>
    );
  }

  if (sequenceStage === 'SUSPENSE_2') {
    return (
      <div className="fixed inset-0 z-50 bg-[#060609] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="text-zinc-500 font-mono-code text-xs uppercase tracking-[0.3em] mb-4">
          {comm?.name}
        </div>

        <h1 className="font-cinzel text-3xl sm:text-5xl font-black text-white tracking-wider uppercase mb-4 animate-pulse">
          YOUR ROLE HAS BEEN DECIDED.
        </h1>

        <div className="h-[2px] w-24 bg-red-600 mx-auto" />
      </div>
    );
  }

  // IDLE OR REVEALED
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center animate-fadeIn">
      {sequenceStage === 'IDLE' ? (
        /* TRIGGER BUTTON STAGE */
        <div className="py-16 space-y-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-600/50 text-amber-400 text-xs font-mono-code uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PORTFOLIO ALLOCATION CLEARED</span>
          </div>

          <h1 className="font-cinzel text-4xl sm:text-6xl font-black text-white tracking-tight uppercase">
            THE VERDICT HAS BEEN MADE
          </h1>

          <p className="font-mono-code text-sm sm:text-base text-zinc-400 max-w-lg mx-auto">
            Your strategic role for <span className="text-white font-bold">{comm?.name}</span> is ready for unsealing.
          </p>

          <div className="pt-6">
            <button
              type="button"
              onClick={triggerRevealSequence}
              className="px-10 sm:px-14 py-5 rounded-xl font-cinzel font-black tracking-[0.25em] text-base uppercase bg-gradient-to-r from-red-700 via-rose-600 to-red-700 text-white hover:from-red-600 hover:to-rose-600 shadow-2xl shadow-red-950/80 ring-2 ring-red-500/80 cursor-pointer scale-100 hover:scale-105 active:scale-95 transition-all"
            >
              UNSEAL YOUR DOSSIER →
            </button>
          </div>
        </div>
      ) : (
        /* FULL CINEMATIC REVEAL CARD */
        <div className="space-y-8 animate-fadeIn">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-red-950/40 border border-red-600/60 text-red-400 text-xs font-mono-code uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>CONFIRMED ASSIGNMENT</span>
          </div>

          <div className="text-zinc-400 font-mono-code text-xs uppercase tracking-widest">
            YOUR ROLE HAS BEEN DECIDED.
          </div>

          {/* Hero Typography of Assigned Portfolio */}
          <div className="rounded-2xl border-2 border-red-600/60 bg-gradient-to-b from-red-950/20 via-zinc-950 to-black p-8 sm:p-14 shadow-2xl shadow-red-950/80 relative overflow-hidden">
            <div className="text-xs font-mono-code text-red-500 uppercase tracking-widest mb-3">
              OFFICIAL MANDATE // {comm?.name}
            </div>

            <h1 className="font-cinzel text-4xl sm:text-6xl font-black text-white uppercase tracking-wider drop-shadow-lg mb-4">
              {asg?.portfolio?.name}
            </h1>

            <p className="font-mono-code text-base sm:text-lg text-amber-400 font-bold mb-6">
              {asg?.portfolio?.short_description}
            </p>

            <p className="font-sans text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed mb-8">
              {asg?.portfolio?.description}
            </p>

            {/* Recipient & Credentials */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono-code text-zinc-400">
              <div className="text-left">
                <span className="block text-zinc-600 text-[10px]">COMMISSIONED TO</span>
                <span className="text-white font-bold text-sm">
                  {ind?.full_name || team?.team_name}
                </span>
              </div>

              <div className="text-center sm:text-right">
                <span className="block text-zinc-600 text-[10px]">REGISTRATION NUMBER</span>
                <span className="text-red-400 font-mono-code font-bold text-sm">
                  {reg.registration_number}
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={triggerRevealSequence}
              className="w-full sm:w-auto px-6 py-3 rounded-lg border border-white/15 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono-code uppercase tracking-wider flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>REPLAY EXPERIENCE</span>
            </button>

            <a
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3 rounded-lg font-cinzel font-bold text-xs uppercase bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-950 flex items-center justify-center space-x-2"
            >
              <span>RETURN TO DOSSIER</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
