import React, { useState } from 'react';
import { Committee } from '../../types';
import { 
  Clapperboard, 
  Gavel, 
  Landmark, 
  Users, 
  User, 
  Calendar, 
  MapPin, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';

interface Stage01BattleSelectProps {
  committees: Committee[];
  selectedCommitteeId: string | null;
  onSelectCommittee: (committeeId: string) => void;
  onProceed: () => void;
  confirmedCountsByCommittee?: Record<string, number>;
}

export const Stage01BattleSelect: React.FC<Stage01BattleSelectProps> = ({
  committees,
  selectedCommitteeId,
  onSelectCommittee,
  onProceed,
  confirmedCountsByCommittee = {},
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getCommitteeIcon = (slug: string) => {
    switch (slug) {
      case 'bollywood-saga':
        return Clapperboard;
      case 'ipl-mega-auction':
        return Gavel;
      case 'lok-sabha':
        return Landmark;
      default:
        return Sparkles;
    }
  };

  const getThemeColors = (slug: string) => {
    switch (slug) {
      case 'bollywood-saga':
        return {
          glow: 'group-hover:border-rose-600',
          selectedBorder: 'border-red-600 ring-2 ring-red-600/60 shadow-2xl shadow-red-950/60',
          badgeBg: 'bg-red-950/40 text-red-400 border-red-800/60',
          accent: 'text-red-500',
          grad: 'from-red-950/20 to-black',
        };
      case 'ipl-mega-auction':
        return {
          glow: 'group-hover:border-amber-600',
          selectedBorder: 'border-amber-500 ring-2 ring-amber-500/60 shadow-2xl shadow-amber-950/60',
          badgeBg: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
          accent: 'text-amber-500',
          grad: 'from-amber-950/20 to-black',
        };
      case 'lok-sabha':
        return {
          glow: 'group-hover:border-sky-600',
          selectedBorder: 'border-sky-500 ring-2 ring-sky-500/60 shadow-2xl shadow-sky-950/60',
          badgeBg: 'bg-sky-950/40 text-sky-400 border-sky-800/60',
          accent: 'text-sky-400',
          grad: 'from-sky-950/20 to-black',
        };
      default:
        return {
          glow: 'group-hover:border-zinc-500',
          selectedBorder: 'border-zinc-400 ring-2 ring-zinc-400/50',
          badgeBg: 'bg-zinc-900 text-zinc-300 border-zinc-700',
          accent: 'text-zinc-300',
          grad: 'from-zinc-900 to-black',
        };
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 animate-fadeIn">
      {/* Editorial Header */}
      <div className="text-center mb-12 sm:mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-950/30 border border-red-800/40 text-red-500 text-xs font-mono-code uppercase tracking-widest mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          <span>STAGE 01 — THE INITIATION</span>
        </div>

        <h1 className="font-cinzel text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white uppercase drop-shadow-md">
          CHOOSE YOUR BATTLE
        </h1>

        <p className="mt-4 font-mono-code text-sm sm:text-base text-zinc-400 max-w-xl mx-auto tracking-wide">
          Three worlds. One decision.
        </p>
      </div>

      {/* Grid of Simulation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {committees.map((comm) => {
          const isSelected = selectedCommitteeId === comm.id;
          const isOtherSelected = selectedCommitteeId !== null && !isSelected;
          const confirmed = confirmedCountsByCommittee[comm.id] || 0;
          const isSoldOut = !comm.is_open || confirmed >= comm.capacity;
          const Icon = getCommitteeIcon(comm.slug);
          const colors = getThemeColors(comm.slug);
          const isExpanded = expandedId === comm.id;

          return (
            <div
              key={comm.id}
              tabIndex={isSoldOut ? -1 : 0}
              role="button"
              onClick={() => {
                if (!isSoldOut) {
                  onSelectCommittee(comm.id);
                }
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isSoldOut) {
                  e.preventDefault();
                  onSelectCommittee(comm.id);
                }
              }}
              className={`group relative rounded-xl border flex flex-col justify-between transition-all duration-300 p-6 sm:p-7 text-left outline-none cursor-pointer select-none bg-gradient-to-b ${colors.grad} ${
                isSoldOut
                  ? 'border-zinc-800/80 bg-zinc-950/40 opacity-70 cursor-not-allowed'
                  : isSelected
                  ? `${colors.selectedBorder} scale-[1.02] z-20`
                  : isOtherSelected
                  ? 'border-white/[0.07] bg-black/40 opacity-55 hover:opacity-90 hover:border-white/20'
                  : `border-white/[0.1] bg-black/60 ${colors.glow} hover:shadow-xl`
              }`}
            >
              {/* Sold Out Watermark / Badge */}
              {isSoldOut && (
                <div className="absolute top-4 right-4 z-30">
                  <span className="px-2.5 py-1 rounded bg-red-950/90 border border-red-700 text-red-400 font-mono-code text-[11px] font-bold tracking-widest uppercase">
                    SOLD OUT
                  </span>
                </div>
              )}

              {/* Top Meta info */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-lg bg-black/80 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className={`w-6 h-6 ${colors.accent}`} />
                  </div>

                  {!isSoldOut && (
                    <span className={`px-2.5 py-1 rounded text-[11px] font-mono-code tracking-wider uppercase border ${colors.badgeBg}`}>
                      {comm.format === 'TEAM' ? 'TEAM — 2–3 MEMBERS' : 'INDIVIDUAL'}
                    </span>
                  )}
                </div>

                {/* Simulation Title */}
                <h3 className="font-cinzel text-xl sm:text-2xl font-bold tracking-wider text-white mb-2 leading-tight">
                  {comm.name}
                </h3>

                {/* Cinematic Hook */}
                <p className="font-sans text-sm sm:text-base font-medium text-zinc-300 italic mb-4 leading-relaxed">
                  "{comm.hook}"
                </p>

                {/* Description Dossier */}
                <p className={`text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans ${isExpanded ? '' : 'line-clamp-3'}`}>
                  {comm.description}
                </p>

                {comm.description.length > 120 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(isExpanded ? null : comm.id);
                    }}
                    className="mt-2 text-[11px] font-mono-code text-zinc-500 hover:text-zinc-300 inline-flex items-center space-x-1"
                  >
                    <Info className="w-3 h-3" />
                    <span>{isExpanded ? 'Collapse dossier' : 'Expand full dossier'}</span>
                  </button>
                )}
              </div>

              {/* Bottom Meta & Venue info */}
              <div className="mt-8 pt-5 border-t border-white/[0.08] space-y-3 font-mono-code text-xs text-zinc-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{comm.date_text}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="truncate max-w-[120px]">{comm.venue_text}</span>
                  </div>
                </div>

                {/* Capacity count if enabled by admin */}
                {comm.public_capacity_visibility && (
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                    <span>CAPACITY POOL</span>
                    <span className="text-zinc-300 font-semibold">{comm.capacity} SLOTS</span>
                  </div>
                )}

                {/* Card Selection Indicator */}
                <div className="pt-2">
                  {isSoldOut ? (
                    <div className="w-full py-2.5 text-center text-xs font-mono-code text-zinc-600 bg-white/[0.02] border border-white/[0.05] rounded">
                      SEATS FILLED
                    </div>
                  ) : isSelected ? (
                    <div className="w-full py-2.5 text-center text-xs font-mono-code font-bold tracking-widest text-white bg-red-600 rounded flex items-center justify-center space-x-2 shadow-lg shadow-red-950/50">
                      <span>ARENA SELECTED</span>
                      <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-full py-2.5 text-center text-xs font-mono-code tracking-wider text-zinc-400 group-hover:text-white bg-white/[0.03] group-hover:bg-white/[0.08] border border-white/10 rounded transition-colors">
                      SELECT ARENA
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Dominant Action CTA */}
      <div className="mt-12 text-center">
        <button
          type="button"
          disabled={!selectedCommitteeId}
          onClick={onProceed}
          className={`px-8 sm:px-12 py-4 rounded-lg font-cinzel font-extrabold tracking-[0.2em] text-sm sm:text-base uppercase transition-all duration-300 shadow-xl ${
            selectedCommitteeId
              ? 'bg-gradient-to-r from-red-700 via-rose-600 to-red-700 text-white hover:from-red-600 hover:to-rose-600 shadow-red-950/60 ring-1 ring-red-500 scale-100 hover:scale-[1.02] active:scale-[0.99] cursor-pointer'
              : 'bg-zinc-900/60 text-zinc-600 border border-white/[0.05] cursor-not-allowed opacity-50'
          }`}
        >
          ENTER THIS BATTLE →
        </button>

        {!selectedCommitteeId && (
          <p className="mt-3 text-xs font-mono-code text-zinc-500 tracking-wider">
            Select one of the three simulation arenas to advance.
          </p>
        )}
      </div>
    </div>
  );
};
