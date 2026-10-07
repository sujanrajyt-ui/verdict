import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldAlert, 
  Terminal, 
  UserCheck, 
  LogOut, 
  LogIn, 
  Compass, 
  Flame, 
  Radio, 
  Menu, 
  X,
  Volume2,
  VolumeX
} from 'lucide-react';

interface VerdictShellProps {
  children: React.ReactNode;
  activePath?: string;
}

export const VerdictShell: React.FC<VerdictShellProps> = ({ children, activePath = '/' }) => {
  const { user, isAdmin, signOut, simulateLoginAs } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [audioActive, setAudioActive] = useState(false);

  const toggleAtmosphericAudio = () => {
    setAudioActive(!audioActive);
    // Atmospheric tone trigger (synthesized via Web Audio API for cinematic tension without external files)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, audioCtx.currentTime); // Low cinematic sub-bass drone (A1)
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 3);
    } catch {
      // AudioContext fallback
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#EDEDED] flex flex-col relative selection:bg-red-950 selection:text-white">
      {/* Background cinematic aura & subtle scanlines */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-red-950/15 rounded-full blur-[140px] animate-ambient-pulse" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-amber-950/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 cinematic-scanlines opacity-40" />
      </div>

      {/* Top Banner: NMAMIT & Event Dates */}
      <header className="relative z-30 border-b border-white/[0.08] bg-[#07070B]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo & Seal */}
            <div className="flex items-center space-x-3">
              <a href="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 rounded-lg bg-black border border-red-800/60 flex items-center justify-center shadow-lg shadow-red-950/30 group-hover:border-red-600 transition-colors">
                  <span className="font-cinzel text-red-600 font-extrabold text-xl tracking-tighter">V</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-cinzel tracking-[0.25em] text-xs text-red-500 uppercase font-semibold">
                    VISTA PRESENTS
                  </span>
                  <span className="font-cinzel text-lg sm:text-xl font-bold tracking-[0.15em] text-white group-hover:text-red-400 transition-colors">
                    THE VERDICT
                  </span>
                </div>
              </a>

              {/* Status Indicator Pill */}
              <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-white/10 ml-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                <span className="font-mono-code text-[11px] text-zinc-400 tracking-wider uppercase">
                  SIMULATION ACTIVE // 16–17 OCT
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <a 
                href="/" 
                className={`text-xs uppercase tracking-widest font-mono-code transition-colors ${
                  activePath === '/' ? 'text-red-500 font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                The Arena
              </a>
              <a 
                href="/register" 
                className={`text-xs uppercase tracking-widest font-mono-code transition-colors ${
                  activePath.startsWith('/register') ? 'text-red-500 font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Register
              </a>
              <a 
                href="/dashboard" 
                className={`text-xs uppercase tracking-widest font-mono-code transition-colors ${
                  activePath.startsWith('/dashboard') ? 'text-red-500 font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Dossier / Dashboard
              </a>
              <a 
                href="/reveal" 
                className={`text-xs uppercase tracking-widest font-mono-code transition-colors ${
                  activePath.startsWith('/reveal') ? 'text-amber-500 font-semibold' : 'text-zinc-400 hover:text-amber-400'
                }`}
              >
                Reveal Portal
              </a>
              {isAdmin && (
                <a 
                  href="/admin" 
                  className={`text-xs uppercase tracking-widest font-mono-code px-2.5 py-1 rounded border border-red-900/60 bg-red-950/30 transition-colors ${
                    activePath.startsWith('/admin') ? 'text-red-400 border-red-500' : 'text-zinc-300 hover:text-red-300'
                  }`}
                >
                  Admin Console
                </a>
              )}
            </nav>

            {/* Right actions: Audio tone, Role Switcher / User menu */}
            <div className="hidden sm:flex items-center space-x-3">
              {/* Cinematic Sound Toggle */}
              <button
                type="button"
                onClick={toggleAtmosphericAudio}
                title="Cinematic Audio Resonance"
                className="p-2 rounded border border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white hover:border-red-600/40 transition-colors"
              >
                {audioActive ? <Volume2 className="w-4 h-4 text-red-500" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {user ? (
                <div className="flex items-center space-x-3 pl-2">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-medium text-white max-w-[140px] truncate">{user.full_name}</span>
                    <span className="text-[10px] font-mono-code tracking-wider uppercase text-zinc-400">
                      {user.role === 'admin' ? 'HIGH COMMAND [ADMIN]' : 'DELEGATE'}
                    </span>
                  </div>
                  {/* Quick toggle between Admin & Participant for testing */}
                  <div className="flex items-center bg-zinc-900/90 border border-white/10 rounded p-0.5">
                    <button
                      onClick={() => simulateLoginAs('participant')}
                      title="Switch to Participant view"
                      className={`px-2 py-0.5 text-[10px] font-mono-code rounded ${
                        user.role === 'participant' ? 'bg-red-900/60 text-white font-bold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      P
                    </button>
                    <button
                      onClick={() => simulateLoginAs('admin')}
                      title="Switch to Admin view"
                      className={`px-2 py-0.5 text-[10px] font-mono-code rounded ${
                        user.role === 'admin' ? 'bg-red-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      A
                    </button>
                  </div>
                  <button
                    onClick={() => signOut()}
                    title="Log Out"
                    className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <a
                  href="/login"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono-code uppercase tracking-wider text-white border border-red-600/50 hover:border-red-500 bg-red-950/20 hover:bg-red-900/30 rounded transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 text-red-500" />
                  <span>Authenticate</span>
                </a>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded text-zinc-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/10 bg-[#0A0A0F] px-4 py-4 space-y-3">
            <a 
              href="/" 
              className="block text-sm font-mono-code uppercase tracking-wider text-zinc-300 py-1"
            >
              The Arena
            </a>
            <a 
              href="/register" 
              className="block text-sm font-mono-code uppercase tracking-wider text-zinc-300 py-1"
            >
              Register
            </a>
            <a 
              href="/dashboard" 
              className="block text-sm font-mono-code uppercase tracking-wider text-zinc-300 py-1"
            >
              Dossier / Dashboard
            </a>
            <a 
              href="/reveal" 
              className="block text-sm font-mono-code uppercase tracking-wider text-amber-400 py-1"
            >
              Reveal Portal
            </a>
            {isAdmin && (
              <a 
                href="/admin" 
                className="block text-sm font-mono-code uppercase tracking-wider text-red-400 py-1"
              >
                Admin Console
              </a>
            )}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              {user ? (
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="text-xs font-medium text-white">{user.full_name}</div>
                    <div className="text-[10px] font-mono-code text-zinc-400 uppercase">{user.role}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => simulateLoginAs(user.role === 'admin' ? 'participant' : 'admin')}
                      className="px-2 py-1 text-[11px] font-mono-code border border-white/20 rounded text-zinc-300"
                    >
                      Swap Role ({user.role === 'admin' ? 'P' : 'A'})
                    </button>
                    <button
                      onClick={() => signOut()}
                      className="p-1.5 text-zinc-400 hover:text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <a
                  href="/login"
                  className="w-full text-center py-2 text-xs font-mono-code uppercase bg-red-950/40 border border-red-700/50 text-white rounded"
                >
                  Authenticate
                </a>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {children}
      </main>

      {/* Cinematic Footer */}
      <footer className="relative z-20 border-t border-white/[0.08] bg-[#050508] text-zinc-500 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono-code">
          <div className="flex items-center space-x-3">
            <span className="text-red-600 font-cinzel font-bold tracking-widest text-sm">VISTA</span>
            <span className="text-zinc-600">|</span>
            <span className="tracking-widest uppercase text-zinc-400">APJ BLOCK, NMAMIT</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">16–17 OCTOBER</span>
          </div>

          <div className="text-zinc-500 text-center sm:text-right">
            <span>HIGH-STAKES SIMULATION PLATFORM</span>
            <span className="mx-2 text-zinc-700">•</span>
            <span className="text-zinc-400">THE VERDICT</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
