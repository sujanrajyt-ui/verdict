import React from 'react';
import { Check, Shield, Award, Users, CreditCard } from 'lucide-react';

interface StageIndicatorProps {
  currentStage: 1 | 2 | 3 | 4;
  onSelectStage?: (stage: 1 | 2 | 3 | 4) => void;
  canNavigateTo?: (stage: 1 | 2 | 3 | 4) => boolean;
}

const STAGES = [
  {
    number: 1,
    id: '01',
    title: 'CHOOSE YOUR BATTLE',
    sub: 'Select Arena',
    icon: Shield,
  },
  {
    number: 2,
    id: '02',
    title: 'CLAIM YOUR ROLE',
    sub: 'Rank Top 3',
    icon: Award,
  },
  {
    number: 3,
    id: '03',
    title: 'ENTER THE ARENA',
    sub: 'Delegate Dossier',
    icon: Users,
  },
  {
    number: 4,
    id: '04',
    title: 'SECURE YOUR ENTRY',
    sub: 'Verify Clearance',
    icon: CreditCard,
  },
] as const;

export const StageIndicator: React.FC<StageIndicatorProps> = ({
  currentStage,
  onSelectStage,
  canNavigateTo = () => false,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto mb-10 px-2 sm:px-4">
      {/* Grid container for the 4 stages */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {STAGES.map((s) => {
          const isCurrent = s.number === currentStage;
          const isCompleted = s.number < currentStage;
          const isClickable = onSelectStage && canNavigateTo(s.number as any);
          const Icon = s.icon;

          return (
            <div
              key={s.id}
              onClick={() => isClickable && onSelectStage(s.number as any)}
              className={`relative overflow-hidden rounded-lg border transition-all duration-300 p-3 sm:p-4 text-left ${
                isCurrent
                  ? 'bg-zinc-900/90 border-red-600 shadow-lg shadow-red-950/40 ring-1 ring-red-600/50'
                  : isCompleted
                  ? 'bg-zinc-950/60 border-zinc-700 hover:border-zinc-500 cursor-pointer'
                  : 'bg-zinc-950/30 border-white/[0.06] opacity-40 select-none'
              } ${isClickable ? 'cursor-pointer hover:bg-zinc-900/60' : ''}`}
            >
              {/* Highlight line for active stage */}
              {isCurrent && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-600 via-rose-500 to-red-700 animate-pulse" />
              )}

              <div className="flex items-center justify-between mb-2">
                <span
                  className={`font-mono-code text-xs font-bold tracking-widest ${
                    isCurrent
                      ? 'text-red-500'
                      : isCompleted
                      ? 'text-zinc-400'
                      : 'text-zinc-600'
                  }`}
                >
                  STAGE {s.id}
                </span>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border text-[11px] font-mono-code transition-colors ${
                    isCurrent
                      ? 'border-red-500 bg-red-950/50 text-white font-bold'
                      : isCompleted
                      ? 'border-emerald-500/80 bg-emerald-950/40 text-emerald-400'
                      : 'border-zinc-800 bg-black/40 text-zinc-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3 h-3" />}
                </div>
              </div>

              <h4
                className={`font-cinzel text-xs sm:text-sm font-bold tracking-wider leading-snug line-clamp-1 ${
                  isCurrent ? 'text-white' : isCompleted ? 'text-zinc-300' : 'text-zinc-500'
                }`}
              >
                {s.title}
              </h4>

              <p
                className={`text-[10px] sm:text-xs font-mono-code mt-0.5 tracking-tight ${
                  isCurrent ? 'text-red-400/90' : isCompleted ? 'text-zinc-500' : 'text-zinc-700'
                }`}
              >
                {s.sub}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
