import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';
import { mockStore } from '../services/mockDataStore';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  role: UserRole;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  simulateLoginAs: (role: UserRole, customEmail?: string, customName?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      if (isSupabaseConfigured() && supabase) {
        // Listen to Supabase Auth
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await syncSupabaseProfile(session.user);
        } else {
          setUser(null);
        }

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            await syncSupabaseProfile(session.user);
          } else {
            setUser(null);
          }
        });

        setIsLoading(false);
        return () => listener.subscription.unsubscribe();
      } else {
        // Local simulation / demo mode
        const store = mockStore.getData();
        setUser(store.currentUser || store.users[0]);
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const syncSupabaseProfile = async (authUser: any) => {
    if (!supabase) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      if (profile) {
        setUser(profile);
      } else {
        // Create profile if first time
        const newProf: UserProfile = {
          id: authUser.id,
          auth_user_id: authUser.id,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Operative',
          email: authUser.email,
          role: 'participant',
          avatar_url: authUser.user_metadata?.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await supabase.from('profiles').insert(newProf);
        setUser(newProf);
      }
    } catch (err) {
      console.error('Failed to sync profile', err);
    }
  };

  const signInWithGoogle = async () => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } else {
      // Simulation Google login
      simulateLoginAs('participant', 'operative.candidate@gmail.com', 'Devansh Rao');
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    const store = mockStore.getData();
    store.currentUser = null;
    mockStore.save();
    setUser(null);
  };

  const simulateLoginAs = (targetRole: UserRole, customEmail?: string, customName?: string) => {
    const store = mockStore.getData();
    let existing = store.users.find((u) => u.role === targetRole);

    if (customEmail) {
      existing = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        auth_user_id: 'auth-' + Math.random().toString(36).substring(2, 9),
        full_name: customName || 'Operative Candidate',
        email: customEmail,
        role: targetRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.users.push(existing);
    }

    if (existing) {
      store.currentUser = existing;
      mockStore.save();
      setUser(existing);
    }
  };

  const role = user?.role || 'participant';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        role,
        isAdmin,
        signInWithGoogle,
        signOut,
        simulateLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
