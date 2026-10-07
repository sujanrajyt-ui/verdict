import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Layers, 
  Briefcase, 
  Shuffle, 
  Sparkles, 
  Download, 
  Settings, 
  ShieldAlert,
  ArrowLeft,
  Lock
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: 'overview' | 'registrations' | 'payments' | 'committees' | 'portfolios' | 'assignments' | 'reveals' | 'exports' | 'settings';
  onSelectTab: (tab: any) => void;
}

const NAV_ITEMS = [
  { id: 'overview', label: 'OVERVIEW', icon: LayoutDashboard },
  { id: 'registrations', label: 'REGISTRATIONS', icon: Users },
  { id: 'payments', label: 'PAYMENTS', icon: CreditCard },
  { id: 'committees', label: 'COMMITTEES', icon: Layers },
  { id: 'portfolios', label: 'PORTFOLIOS', icon: Briefcase },
  { id: 'assignments', label: 'ASSIGNMENTS', icon: Shuffle },
  { id: 'reveals', label: 'REVEALS', icon: Sparkles },
  { id: 'exports', label: 'EXPORTS', icon: Download },
  { id: 'settings', label: 'SETTINGS', icon: Settings },
] as const;

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onSelectTab }) => {
  const { user, isAdmin, simulateLoginAs } = useAuth();

  // Strict route protection
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-700 flex items-center justify-center mx-auto text-red-500">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-cinzel text-2xl font-bold text-white uppercase tracking-wider">
          RESTRICTED CLEARANCE
        </h2>
        <p className="font-mono-code text-xs text-zinc-400">
          Administrative authority required. Authenticate as High Command or swap role in header.
        </p>
        <button
          type="button"
          onClick={() => simulateLoginAs('admin')}
          className="px-6 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white font-mono-code text-xs font-bold uppercase tracking-wider"
        >
          AUTHENTICATE AS HIGH COMMAND
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] bg-[#07070B] text-zinc-200">
      {/* Top Admin Sub-Header */}
      <div className="border-b border-white/10 bg-black/60 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-cinzel font-bold text-white text-sm sm:text-base tracking-widest uppercase">
            HIGH COMMAND CONTROL SYSTEM
          </span>
          <span className="text-[11px] font-mono-code text-zinc-500">
            // MASTER OPS CONSOLE
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/"
            className="text-xs font-mono-code text-zinc-400 hover:text-white flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Arena</span>
          </a>
          <span className="text-zinc-600">|</span>
          <span className="text-xs font-mono-code text-red-400">
            OFFICER: {user?.full_name}
          </span>
        </div>
      </div>

      {/* Admin Horizontal Tab Bar */}
      <div className="border-b border-white/[0.08] bg-zinc-950/90 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 sm:space-x-2 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono-code tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-red-950/80 text-white font-bold border border-red-600/80 shadow-md shadow-red-950/50'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-red-500' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Admin Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
};
