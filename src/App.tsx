import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { VerdictShell } from './components/layout/VerdictShell';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { RevealPage } from './pages/RevealPage';
import { AdminPage } from './pages/admin/AdminPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Intercept anchor clicks to enable fluid SPA navigation
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.getAttribute('href')?.startsWith('/')) {
        const href = target.getAttribute('href')!;
        // Don't intercept target=_blank or downloads
        if (target.getAttribute('target') === '_blank' || target.hasAttribute('download')) {
          return;
        }
        e.preventDefault();
        window.history.pushState({}, '', href);
        setCurrentPath(href);
        window.scrollTo(0, 0);
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  const renderCurrentPage = () => {
    if (currentPath === '/' || currentPath === '') {
      return <LandingPage />;
    }
    if (currentPath.startsWith('/register')) {
      return <RegisterPage />;
    }
    if (currentPath.startsWith('/login')) {
      return <LoginPage />;
    }
    if (currentPath.startsWith('/dashboard')) {
      return <DashboardPage />;
    }
    if (currentPath.startsWith('/reveal')) {
      return <RevealPage />;
    }
    if (currentPath.startsWith('/admin')) {
      return <AdminPage />;
    }

    // Default fallback to Landing Page
    return <LandingPage />;
  };

  return (
    <AuthProvider>
      <VerdictShell activePath={currentPath}>
        {renderCurrentPage()}
      </VerdictShell>
    </AuthProvider>
  );
}
