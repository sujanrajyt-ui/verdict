import React, { useState } from 'react';
import { Portfolio, Committee } from '../../types';
import { 
  Award, 
  Check, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  AlertTriangle, 
  GripVertical, 
  Sparkles,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface Stage02RoleClaimProps {
  committee: Committee;
  portfolios: Portfolio[];
  selectedPortfolioIds: [string | null, string | null, string | null];
  onRankPortfolio: (rankIndex: 0 | 1 | 2, portfolioId: string | null) => void;
  onProceed: () => void;
  onRequestChangeBattle: () => void;
}

export const Stage02RoleClaim: React.FC<Stage02RoleClaimProps> = ({
  committee,
  portfolios,
  selectedPortfolioIds,
  onRankPortfolio,
  onProceed,
  onRequestChangeBattle,
}) => {
  const [activeSlotToAssign, setActiveSlotToAssign] = useState<0 | 1 | 2>(0);
  const [draggedPortfolioId, setDraggedPortfolioId] = useState<string | null>(null);

  const isComplete = Boolean(
    selectedPortfolioIds[0] && 
    selectedPortfolioIds[1] && 
    selectedPortfolioIds[2] &&
    new Set(selectedPortfolioIds).size === 3
  );

  const getRankedPortfolio = (index: 0 | 1 | 2): Portfolio | undefined => {
    const id = selectedPortfolioIds[index];
    if (!id) return undefined;
    return portfolios.find((p) => p.id === id);
  };

  const handleCardClick = (portId: string) => {
    // If this portfolio is already in one of the slots, remove it
    const existingIndex = selectedPortfolioIds.indexOf(portId);
    if (existingIndex !== -1) {
      onRankPortfolio(existingIndex as 0 | 1 | 2, null);
      setActiveSlotToAssign(existingIndex as 0 | 1 | 2);
      return;
    }

    // Find first empty slot, or use active slot
    const emptySlot = selectedPortfolioIds.findIndex((id) => id === null);
    const targetSlot = emptySlot !== -1 ? (emptySlot as 0 | 1 | 2) : activeSlotToAssign;

    onRankPortfolio(targetSlot, portId);

    // Auto-advance target slot to next empty
    const nextEmpty = [0, 1, 2].find(
      (idx) => idx !== targetSlot && selectedPortfolioIds[idx] === null
    );
    if (nextEmpty !== undefined) {
      setActiveSlotToAssign(nextEmpty as 0 | 1 | 2);
    }
  };

  const clearSlot = (index: 0 | 1 | 2, e: React.MouseEvent) => {
    e.stopPropagation();
    onRankPortfolio(index, null);
    setActiveSlotToAssign(index);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, portId: string) => {
    setDraggedPortfolioId(portId);
    e.dataTransfer.setData('text/plain', portId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnSlot = (e: React.DragEvent, slotIndex: 0 | 1 | 2) => {
    e.preventDefault();
    const portId = e.dataTransfer.getData('text/plain') || draggedPortfolioId;
    if (portId) {
      // If already placed elsewhere, swap or clear
      const existingIdx = selectedPortfolioIds.indexOf(portId);
      if (existingIdx !== -1) {
        onRankPortfolio(existingIdx as 0 | 1 | 2, null);
      }
      onRankPortfolio(slotIndex, portId);
      setDraggedPortfolioId(null);
    }
  };

  const slotLabels = [
    { title: '01 — FIRST CHOICE', priority: 'Primary Strategic Priority' },
    { title: '02 — SECOND CHOICE', priority: 'Secondary Contingency' },
    { title: '03 — THIRD CHOICE', priority: 'Tertiary Strategic Option' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 animate-fadeIn">
      {/* Editorial Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-950/30 border border-red-800/40 text-red-500 text-xs font-mono-code uppercase tracking-widest mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>STAGE 02 — STRATEGIC MANDATE</span>
        </div>

        <h1 className="font-cinzel text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase drop-shadow-md">
          CLAIM YOUR ROLE
        </h1>

        <p className="mt-3 font-mono-code text-sm sm:text-base text-zinc-400 max-w-lg mx-auto">
          Choose three. The order matters.
        </p>

        {/* Selected Battle Badge with Switch Option */}
        <div className="mt-4 inline-flex items-center space-x-3 px-4 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono-code">
          <span className="text-zinc-400">ACTIVE BATTLE:</span>
          <span className="text-red-400 font-bold tracking-wider uppercase font-cinzel">
            {committee.name}
          </span>
          <button
            type="button"
            onClick={onRequestChangeBattle}
            className="text-[11px] text-zinc-500 hover:text-red-400 underline underline-offset-2 ml-2 transition-colors"
          >
            Change Battle
          </button>
        </div>
      </div>

      {/* TOP 3 RANKING PODIUM / SLOTS */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="font-cinzel text-sm sm:text-base font-bold tracking-wider text-zinc-300 uppercase flex items-center space-x-2">
            <Award className="w-4 h-4 text-red-500" />
            <span>YOUR STRATEGIC HIERARCHY</span>
          </h3>
          <span className="text-xs font-mono-code text-zinc-500">
            {isComplete ? 'ALL 3 SLOTS SECURED' : 'DRAG OR TAP CARDS TO ASSIGN'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([0, 1, 2] as const).map((slotIdx) => {
            const assigned = getRankedPortfolio(slotIdx);
            const isActive = activeSlotToAssign === slotIdx;
            const meta = slotLabels[slotIdx];

            return (
              <div
                key={slotIdx}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnSlot(e, slotIdx)}
                onClick={() => setActiveSlotToAssign(slotIdx)}
                className={`relative rounded-xl border p-4 sm:p-5 transition-all duration-300 min-h-[160px] flex flex-col justify-between ${
                  assigned
                    ? 'bg-zinc-900/90 border-red-600/70 shadow-lg shadow-red-950/40 ring-1 ring-red-600/40'
                    : isActive
                    ? 'bg-red-950/20 border-red-500/80 ring-2 ring-red-500/40 border-dashed'
                    : 'bg-zinc-950/50 border-white/10 border-dashed hover:border-white/20'
                }`}
              >
                {/* Slot Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-cinzel text-sm font-extrabold tracking-widest ${
                        assigned ? 'text-red-500' : isActive ? 'text-red-400' : 'text-zinc-500'
                      }`}
                    >
                      {meta.title}
                    </span>
                  </div>

                  {assigned ? (
                    <button
                      type="button"
                      onClick={(e) => clearSlot(slotIdx, e)}
                      title="Clear slot"
                      className="p-1 rounded bg-black/60 text-zinc-400 hover:text-white hover:bg-red-950 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono-code text-zinc-500 uppercase">
                      {isActive ? 'ACTIVE TARGET' : 'EMPTY'}
                    </span>
                  )}
                </div>

                {/* Assigned Content vs Empty Prompt */}
                {assigned ? (
                  <div className="my-2">
                    <h4 className="font-cinzel text-base font-bold text-white tracking-wide">
                      {assigned.name}
                    </h4>
                    <p className="font-mono-code text-xs text-red-400 mt-0.5">
                      {assigned.short_description}
                    </p>
                    <p className="text-xs text-zinc-400 font-sans mt-1 line-clamp-2">
                      {assigned.description}
                    </p>
                  </div>
                ) : (
                  <div className="my-auto text-center py-4 text-zinc-600">
                    <p className="font-mono-code text-xs tracking-wider">
                      DROP OR TAP A ROLE BELOW
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1">{meta.priority}</p>
                  </div>
                )}

                {/* Slot Footer indicator */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono-code text-zinc-500">
                  <span>PRIORITY WEIGHT</span>
                  <span className={assigned ? 'text-red-400 font-bold' : 'text-zinc-600'}>
                    RANK {slotIdx + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AVAILABLE PORTFOLIOS REPOSITORY */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="font-cinzel text-sm sm:text-base font-bold tracking-wider text-zinc-300 uppercase">
            AVAILABLE PORTFOLIOS ({portfolios.length})
          </h3>
          <span className="text-xs font-mono-code text-zinc-500">
            Click to assign / remove
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map((port) => {
            const isAssigned = selectedPortfolioIds.includes(port.id);
            const assignedRank = selectedPortfolioIds.indexOf(port.id);

            return (
              <div
                key={port.id}
                draggable={!isAssigned}
                onDragStart={(e) => handleDragStart(e, port.id)}
                onClick={() => handleCardClick(port.id)}
                className={`group relative rounded-xl border p-4 sm:p-5 transition-all duration-200 text-left cursor-pointer select-none flex flex-col justify-between ${
                  isAssigned
                    ? 'bg-zinc-950/80 border-red-800/80 ring-1 ring-red-800/50 opacity-90'
                    : 'bg-black/60 border-white/10 hover:border-zinc-500 hover:bg-zinc-900/60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono-code text-[11px] text-zinc-500 tracking-wider uppercase">
                      ROLE #{port.display_order}
                    </span>

                    {isAssigned ? (
                      <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-700/80 font-mono-code text-[11px] font-bold tracking-wider">
                        RANK {assignedRank + 1}
                      </span>
                    ) : (
                      <span className="text-zinc-600 group-hover:text-zinc-400">
                        <GripVertical className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <h4 className="font-cinzel text-base font-bold text-white group-hover:text-red-400 transition-colors">
                    {port.name}
                  </h4>

                  <p className="font-mono-code text-xs text-zinc-400 mt-1">
                    {port.short_description}
                  </p>

                  <p className="text-xs text-zinc-400 mt-2 line-clamp-3 font-sans leading-relaxed">
                    {port.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono-code">
                  <span className="text-zinc-500">QUOTA</span>
                  <span className="text-zinc-300 font-semibold">{port.capacity} SEATS</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
        <button
          type="button"
          onClick={onRequestChangeBattle}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg border border-white/10 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-500 text-xs font-mono-code uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>CHANGE BATTLE</span>
        </button>

        <button
          type="button"
          disabled={!isComplete}
          onClick={onProceed}
          className={`w-full sm:w-auto px-8 sm:px-12 py-3.5 rounded-lg font-cinzel font-extrabold tracking-[0.2em] text-sm uppercase transition-all duration-300 shadow-xl ${
            isComplete
              ? 'bg-gradient-to-r from-red-700 via-rose-600 to-red-700 text-white hover:from-red-600 hover:to-rose-600 shadow-red-950/60 ring-1 ring-red-500 cursor-pointer'
              : 'bg-zinc-900/60 text-zinc-600 border border-white/[0.05] cursor-not-allowed opacity-50'
          }`}
        >
          LOCK PREFERENCES & PROCEED →
        </button>
      </div>
    </div>
  );
};
