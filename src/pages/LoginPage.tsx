import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Shield, ArrowRight, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, signInWithGoogle, simulateLoginAs, isAdmin } = useAuth();
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      window.location.href = '/dashboard';
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomLogin = (role: 'participant' | 'admin') => {
    simulateLoginAs(
      role, 
      customEmail || (role === 'admin' ? 'admin@verdict.nmamit.in' : 'delegate@nmamit.in'), 
      customName || (role === 'admin' ? 'Commandant Admin' : 'Lead Delegate')
    );
    window.location.href = role === 'admin' ? '/admin' : '/dashboard';
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-md p-8 text-center space-y-6 shadow-2xl shadow-red-950/40">
        <div className="w-12 h-12 rounded-xl bg-black border border-red-800/80 flex items-center justify-center mx-auto text-red-500 shadow-lg shadow-red-950/50">
          <Shield className="w-6 h-6" />
        </div>

        <div>
          <span className="text-[11px] font-mono-code text-red-500 uppercase tracking-widest block mb-1">
            IDENTITY CLEARANCE
          </span>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-white tracking-wider uppercase">
            AUTHENTICATE
          </h1>
          <p className="font-mono-code text-xs text-zinc-400 mt-2">
            Sign in to access your registration dossier and reveal portal.
          </p>
        </div>

        {/* Supabase Google OAuth Button */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleGoogleLogin}
          className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-black font-mono-code text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-3 shadow-lg transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>CONTINUE WITH GOOGLE</span>
        </button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-zinc-600 text-[10px] font-mono-code uppercase">
            OR DEMO ACCREDITATION
          </span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        {/* Quick Simulation / Testing Profiles */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <button
            type="button"
            onClick={() => handleCustomLogin('participant')}
            className="p-3 rounded-lg border border-white/10 bg-black/60 hover:bg-zinc-900 text-left transition-colors"
          >
            <div className="text-xs font-bold text-white">DELEGATE LOGIN</div>
            <div className="text-[10px] font-mono-code text-zinc-500">Aditya Shenoy</div>
          </button>

          <button
            type="button"
            onClick={() => handleCustomLogin('admin')}
            className="p-3 rounded-lg border border-red-900/60 bg-red-950/20 hover:bg-red-900/30 text-left transition-colors"
          >
            <div className="text-xs font-bold text-red-400">HIGH COMMAND</div>
            <div className="text-[10px] font-mono-code text-zinc-500">Admin Console</div>
          </button>
        </div>

        {user && (
          <div className="pt-2 text-xs font-mono-code text-zinc-400">
            Currently authenticated as: <span className="text-white font-bold">{user.full_name}</span> ({user.role})
          </div>
        )}
      </div>
    </div>
  );
};
