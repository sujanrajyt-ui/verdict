import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ChangeBattleConfirmDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ChangeBattleConfirmDialog: React.FC<ChangeBattleConfirmDialogProps> = ({
  isOpen,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-xl border border-red-800/80 bg-[#0C0C12] p-6 text-center shadow-2xl shadow-red-950/80">
        <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-600 flex items-center justify-center mx-auto mb-4 text-red-500">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="font-cinzel text-xl font-bold text-white uppercase tracking-wider mb-2">
          RESET PORTFOLIO PREFERENCES?
        </h3>

        <p className="font-mono-code text-xs text-zinc-300 leading-relaxed mb-6">
          Changing your battle will reset your portfolio preferences.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-4 rounded-lg border border-white/10 bg-zinc-900 text-zinc-300 hover:text-white text-xs font-mono-code uppercase tracking-wider transition-colors"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-3 px-4 rounded-lg bg-red-700 hover:bg-red-600 text-white font-mono-code text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-red-950"
          >
            CHANGE BATTLE
          </button>
        </div>
      </div>
    </div>
  );
};
