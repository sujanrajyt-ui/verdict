import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Committee } from '../types';
import { 
  ArrowRight, 
  Calendar, 
  MapPin, 
  Clapperboard, 
  Gavel, 
  Landmark, 
  ShieldAlert, 
  Sparkles,
  Users,
  Award
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [committees, setCommittees] = useState<Committee[]>([]);

  useEffect(() => {
    dataService.getCommittees().then(setCommittees);
  }, []);

  const getIcon = (slug: string) => {
    if (slug === 'bollywood-saga') return Clapperboard;
    if (slug === 'ipl-mega-auction') return Gavel;
    return Landmark;
  };

  return (
    <div className="w-full relative overflow-hidden">
      {/* Cinematic Hero Section */}
      <section className="relative pt-16 sm:pt-28 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-red-950/40 border border-red-800/60 text-red-500 text-xs font-mono-code uppercase tracking-widest mb-8 animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          <span>VISTA PRESENTS // NMAMIT APJ BLOCK</span>
        </div>

        {/* Main Cinematic Title */}
        <h1 className="font-cinzel text-5xl sm:text-7xl lg:text-9xl font-black tracking-tight text-white uppercase drop-shadow-2xl">
          THE VERDICT
        </h1>

        {/* Supporting Copy */}
        <div className="mt-6 sm:mt-8 space-y-1 font-mono-code text-base sm:text-2xl text-zinc-300 max-w-2xl mx-auto tracking-wide">
          <p>Three worlds.</p>
          <p>One arena.</p>
          <p className="text-red-500 font-bold">Your decision.</p>
        </div>

        {/* Key Event Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-mono-code text-zinc-400">
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-zinc-950/80 border border-white/10">
            <Calendar className="w-4 h-4 text-red-500" />
            <span>16–17 OCTOBER</span>
          </div>
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-zinc-950/80 border border-white/10">
            <MapPin className="w-4 h-4 text-red-500" />
            <span>APJ BLOCK, NMAMIT</span>
          </div>
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-zinc-950/80 border border-white/10">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>HIGH-STAKES SIMULATION</span>
          </div>
        </div>

        {/* Dominant CTA */}
        <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/register"
            className="w-full sm:w-auto px-10 sm:px-14 py-4 sm:py-5 rounded-xl font-cinzel font-black tracking-[0.2em] text-sm sm:text-base uppercase bg-gradient-to-r from-red-700 via-rose-600 to-red-700 text-white hover:from-red-600 hover:to-rose-600 shadow-2xl shadow-red-950/80 ring-2 ring-red-500/80 scale-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 cursor-pointer"
          >
            <span>ENTER THE VERDICT →</span>
          </a>

          <a
            href="/login"
            className="w-full sm:w-auto px-8 py-4 sm:py-5 rounded-xl font-mono-code text-xs sm:text-sm uppercase tracking-wider bg-black/60 border border-white/10 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
          >
            <span>ACCESS DOSSIER</span>
          </a>
        </div>
      </section>

      {/* The Three Worlds Section */}
      <section className="py-16 sm:py-24 border-t border-white/[0.08] bg-[#07070B]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="font-mono-code text-xs text-red-500 uppercase tracking-widest block mb-2">
              SIMULATION ARENAS
            </span>
            <h2 className="font-cinzel text-3xl sm:text-5xl font-extrabold text-white uppercase tracking-wider">
              THREE WORLDS AWAIT
            </h2>
            <p className="mt-3 font-mono-code text-xs sm:text-sm text-zinc-400">
              Select your battleground. Every arena demands unique strategic acumen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {committees.map((comm, idx) => {
              const Icon = getIcon(comm.slug);
              return (
                <div
                  key={comm.id}
                  className="rounded-2xl border border-white/10 bg-zinc-950/60 p-8 flex flex-col justify-between hover:border-red-600/50 hover:bg-zinc-900/40 transition-all duration-300 group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-mono-code text-zinc-500 uppercase">
                        ARENA 0{idx + 1}
                      </span>
                    </div>

                    <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
                      {comm.name}
                    </h3>

                    <p className="font-sans text-sm font-medium text-zinc-300 italic mb-4">
                      "{comm.hook}"
                    </p>

                    <p className="text-xs text-zinc-400 leading-relaxed font-sans line-clamp-4">
                      {comm.description}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono-code">
                    <span className="text-zinc-500 uppercase">
                      {comm.format === 'TEAM' ? 'TEAM (2–3 MEMBERS)' : 'INDIVIDUAL'}
                    </span>
                    <a
                      href="/register"
                      className="text-red-500 hover:text-red-400 font-bold inline-flex items-center space-x-1"
                    >
                      <span>ENTER</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
