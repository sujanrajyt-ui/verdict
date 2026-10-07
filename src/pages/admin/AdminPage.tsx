import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';
import { 
  FullRegistrationDetail, 
  Committee, 
  PricingRule, 
  Portfolio, 
  AppSettings 
} from '../../types';
import { AdminLayout } from './AdminLayout';
import { AdminOverview } from './AdminOverview';
import { AdminRegistrations } from './AdminRegistrations';
import { AdminPayments } from './AdminPayments';
import { AdminCommittees } from './AdminCommittees';
import { AdminPortfolios } from './AdminPortfolios';
import { AdminAssignments } from './AdminAssignments';
import { AdminReveals } from './AdminReveals';
import { AdminExports } from './AdminExports';
import { AdminSettings } from './AdminSettings';

type AdminTab = 'overview' | 'registrations' | 'payments' | 'committees' | 'portfolios' | 'assignments' | 'reveals' | 'exports' | 'settings';

const getTabFromPath = (path: string): AdminTab => {
  const p = path.toLowerCase();
  if (p.includes('/admin/registrations')) return 'registrations';
  if (p.includes('/admin/payments')) return 'payments';
  if (p.includes('/admin/committees')) return 'committees';
  if (p.includes('/admin/portfolios')) return 'portfolios';
  if (p.includes('/admin/assignments')) return 'assignments';
  if (p.includes('/admin/reveals')) return 'reveals';
  if (p.includes('/admin/exports')) return 'exports';
  if (p.includes('/admin/settings')) return 'settings';
  return 'overview';
};

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(() => getTabFromPath(window.location.pathname));

  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<FullRegistrationDetail[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    const targetPath = tab === 'overview' ? '/admin' : `/admin/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const fetchAdminData = async () => {
    try {
      const [regs, comms, rules, ports, settings] = await Promise.all([
        dataService.getAllRegistrations(),
        dataService.getCommittees(),
        dataService.getPricingRules(),
        dataService.getPortfolios(),
        dataService.getAppSettings(),
      ]);

      setRegistrations(regs);
      setCommittees(comms);
      setPricingRules(rules);
      setPortfolios(ports);
      setAppSettings(settings);
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifyPayment = async (paymentId: string) => {
    try {
      const updated = await dataService.verifyPayment(paymentId, user?.auth_user_id);
      notificationService.sendEmail({
        toEmail: updated.registration.contact_email,
        recipientName: updated.individual?.full_name || updated.team?.team_name || 'Delegate',
        registrationNumber: updated.registration.registration_number,
        committeeName: updated.committee?.name || 'Simulation Arena',
        type: 'PAYMENT_VERIFIED',
      });
      notificationService.sendWhatsApp({
        toEmail: updated.registration.contact_email,
        recipientName: updated.individual?.full_name || updated.team?.team_name || 'Delegate',
        registrationNumber: updated.registration.registration_number,
        committeeName: updated.committee?.name || 'Simulation Arena',
        type: 'PAYMENT_VERIFIED',
      });
      await fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectPayment = async (paymentId: string, reason: string) => {
    try {
      const updated = await dataService.rejectPayment(paymentId, reason, user?.auth_user_id);
      notificationService.sendEmail({
        toEmail: updated.registration.contact_email,
        recipientName: updated.individual?.full_name || updated.team?.team_name || 'Delegate',
        registrationNumber: updated.registration.registration_number,
        committeeName: updated.committee?.name || 'Simulation Arena',
        customNote: reason,
        type: 'PAYMENT_REJECTED',
      });
      notificationService.sendWhatsApp({
        toEmail: updated.registration.contact_email,
        recipientName: updated.individual?.full_name || updated.team?.team_name || 'Delegate',
        registrationNumber: updated.registration.registration_number,
        committeeName: updated.committee?.name || 'Simulation Arena',
        customNote: reason,
        type: 'PAYMENT_REJECTED',
      });
      await fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
        <p className="font-mono-code text-xs text-zinc-400 tracking-widest uppercase">
          INITIALIZING HIGH COMMAND CONSOLE...
        </p>
      </div>
    );
  }

  return (
    <AdminLayout activeTab={activeTab} onSelectTab={handleSelectTab}>
      {activeTab === 'overview' && (
        <AdminOverview
          registrations={registrations}
          committees={committees}
          onNavigateTab={handleSelectTab}
        />
      )}

      {activeTab === 'registrations' && (
        <AdminRegistrations
          registrations={registrations}
          committees={committees}
          onRefresh={fetchAdminData}
          onVerifyPayment={handleVerifyPayment}
          onRejectPayment={handleRejectPayment}
        />
      )}

      {activeTab === 'payments' && (
        <AdminPayments
          registrations={registrations}
          onRefresh={fetchAdminData}
          onVerifyPayment={handleVerifyPayment}
          onRejectPayment={handleRejectPayment}
        />
      )}

      {activeTab === 'committees' && (
        <AdminCommittees
          committees={committees}
          pricingRules={pricingRules}
          onRefresh={fetchAdminData}
        />
      )}

      {activeTab === 'portfolios' && (
        <AdminPortfolios
          portfolios={portfolios}
          committees={committees}
          registrations={registrations}
          onRefresh={fetchAdminData}
        />
      )}

      {activeTab === 'assignments' && (
        <AdminAssignments
          committees={committees}
          portfolios={portfolios}
          registrations={registrations}
          onRefresh={fetchAdminData}
        />
      )}

      {activeTab === 'reveals' && (
        <AdminReveals
          committees={committees}
          registrations={registrations}
          onRefresh={fetchAdminData}
        />
      )}

      {activeTab === 'exports' && (
        <AdminExports
          registrations={registrations}
          committees={committees}
        />
      )}

      {activeTab === 'settings' && appSettings && (
        <AdminSettings
          appSettings={appSettings}
          onRefresh={fetchAdminData}
        />
      )}
    </AdminLayout>
  );
};
