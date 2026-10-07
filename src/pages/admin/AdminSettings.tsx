import React, { useState, useEffect } from 'react';
import { AppSettings, AuditLog } from '../../types';
import { dataService } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';
import { 
  Settings, 
  Save, 
  CheckCircle, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  QrCode, 
  Mail, 
  MessageSquare, 
  History, 
  ShieldCheck,
  Send
} from 'lucide-react';

interface AdminSettingsProps {
  appSettings: AppSettings;
  onRefresh: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  appSettings,
  onRefresh,
}) => {
  const [formData, setFormData] = useState<AppSettings>(appSettings);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testNoticeStatus, setTestNoticeStatus] = useState<string | null>(null);

  const providerStatus = notificationService.getProviderStatus();

  useEffect(() => {
    setFormData(appSettings);
    dataService.getAuditLogs().then(setAuditLogs);
  }, [appSettings]);

  const handleSaveSettings = async () => {
    try {
      await dataService.updateAppSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendTestNotification = async (channel: 'EMAIL' | 'WHATSAPP') => {
    setTestNoticeStatus(`Sending test ${channel}...`);
    try {
      if (channel === 'EMAIL') {
        await notificationService.sendEmail({
          toEmail: 'test.delegate@example.com',
          recipientName: 'Lead Delegate',
          registrationNumber: 'THEV-00101',
          committeeName: 'BOLLYWOOD SAGA',
          type: 'REGISTRATION_CONFIRMED',
        });
      } else {
        await notificationService.sendWhatsApp({
          toEmail: 'test.delegate@example.com',
          toPhone: '+919876543210',
          recipientName: 'Lead Delegate',
          registrationNumber: 'THEV-00101',
          committeeName: 'BOLLYWOOD SAGA',
          type: 'REGISTRATION_CONFIRMED',
        });
      }
      setTestNoticeStatus(`Test ${channel} dispatched successfully.`);
      setTimeout(() => setTestNoticeStatus(null), 3000);
    } catch (e: any) {
      setTestNoticeStatus(`Dispatch error: ${e?.message}`);
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn text-left">
      {/* Top Header */}
      <div>
        <h2 className="font-cinzel text-2xl font-extrabold text-white uppercase tracking-wider">
          SYSTEM PARAMETERS & INTEGRATIONS
        </h2>
        <p className="font-mono-code text-xs text-zinc-400 mt-0.5">
          Configure admission gates, accreditation QR codes, external communication adapters, and audit history.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-mono-code flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>Settings committed to persistent database.</span>
        </div>
      )}

      {/* SECTION 1: EVENT PARAMETERS & ADMISSION GATE */}
      <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-6 sm:p-8 space-y-6">
        <h3 className="font-cinzel text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-3 border-b border-white/10">
          <Settings className="w-4 h-4 text-red-500" />
          <span>EVENT CONFIGURATION & ADMISSION GATE</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-mono-code">
          <div>
            <label className="block text-zinc-400 uppercase mb-1">Event Master Title</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-black/70 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-zinc-400 uppercase mb-1">Event Dates</label>
            <input
              type="text"
              value={formData.dates}
              onChange={(e) => setFormData({ ...formData, dates: e.target.value })}
              className="w-full bg-black/70 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-zinc-400 uppercase mb-1">Venue Location</label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full bg-black/70 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-zinc-400 uppercase mb-1">Official Support Email</label>
            <input
              type="email"
              value={formData.support_contact}
              onChange={(e) => setFormData({ ...formData, support_contact: e.target.value })}
              className="w-full bg-black/70 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        {/* Global Admission Toggle */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
          <div>
            <span className="font-cinzel font-bold text-white text-sm block">
              PUBLIC REGISTRATION ADMISSION GATE
            </span>
            <span className="font-mono-code text-xs text-zinc-400 mt-0.5 block">
              When toggled off, `/register` locks and displays "REGISTRATION CLOSED".
            </span>
          </div>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, registration_open: !formData.registration_open })}
            className={`px-4 py-2 rounded-lg font-mono-code text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-colors ${
              formData.registration_open
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                : 'bg-red-950 text-red-400 border border-red-700'
            }`}
          >
            {formData.registration_open ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{formData.registration_open ? 'REGISTRATION OPEN' : 'REGISTRATION CLOSED'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: UPI PAYMENT & QR CODE ASSETS */}
      <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-6 sm:p-8 space-y-6">
        <h3 className="font-cinzel text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-3 border-b border-white/10">
          <QrCode className="w-4 h-4 text-red-500" />
          <span>PAYMENT RECEIVING REPOSITORIES</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-mono-code">
          <div>
            <label className="block text-zinc-400 uppercase mb-1">Receiving UPI ID</label>
            <input
              type="text"
              value={formData.upi_id}
              onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
              className="w-full bg-black/70 border border-white/10 rounded-lg px-3 py-2 text-white font-bold"
            />
          </div>

          <div>
            <label className="block text-zinc-400 uppercase mb-1">QR Code Image / Storage URL</label>
            <input
              type="text"
              value={formData.qr_code_url}
              onChange={(e) => setFormData({ ...formData, qr_code_url: e.target.value })}
              className="w-full bg-black/70 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-white p-1 rounded-lg border border-white/20">
            <img src={formData.qr_code_url} alt="Current QR" className="w-full h-full object-contain" />
          </div>
          <p className="text-[11px] font-mono-code text-zinc-400 max-w-sm">
            Current QR rendered on Stage 04 for all incoming participants. Updatable in real-time.
          </p>
        </div>
      </div>

      {/* Save Button for Settings */}
      <div>
        <button
          type="button"
          onClick={handleSaveSettings}
          className="px-8 py-3 rounded-lg bg-red-700 hover:bg-red-600 text-white font-cinzel font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-colors shadow-lg shadow-red-950"
        >
          <Save className="w-4 h-4" />
          <span>SAVE SYSTEM PARAMETERS</span>
        </button>
      </div>

      {/* SECTION 3: EXTERNAL NOTIFICATION PROVIDERS */}
      <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-6 sm:p-8 space-y-6">
        <h3 className="font-cinzel text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-3 border-b border-white/10">
          <MessageSquare className="w-4 h-4 text-red-500" />
          <span>NOTIFICATION INFRASTRUCTURE STATUS</span>
        </h3>

        {testNoticeStatus && (
          <div className="p-3 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono-code text-zinc-300">
            {testNoticeStatus}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Provider Card */}
          <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-cinzel font-bold text-sm text-white flex items-center space-x-2">
                <Mail className="w-4 h-4 text-zinc-400" />
                <span>TRANSACTIONAL EMAIL (RESEND)</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase ${
                  providerStatus.emailConfigured
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {providerStatus.emailConfigured ? 'LIVE DISPATCH CONFIGURED' : 'DEVELOPMENT SIMULATED'}
              </span>
            </div>

            <p className="text-xs font-mono-code text-zinc-400">
              Templates: Registration Received, Payment Verified, Resubmission Notice, Portfolio Reveal.
            </p>

            <button
              type="button"
              onClick={() => handleSendTestNotification('EMAIL')}
              className="px-3.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[11px] font-mono-code text-zinc-300 hover:text-white flex items-center space-x-1.5"
            >
              <Send className="w-3 h-3" />
              <span>Test Email Adapter</span>
            </button>
          </div>

          {/* WhatsApp Provider Card */}
          <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-cinzel font-bold text-sm text-white flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span>WHATSAPP CLOUD API / TWILIO</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase ${
                  providerStatus.whatsappConfigured
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                    : 'bg-red-950/80 text-red-400 border border-red-800'
                }`}
              >
                {providerStatus.whatsappConfigured ? 'CONNECTED' : 'WHATSAPP NOT CONFIGURED'}
              </span>
            </div>

            <p className="text-xs font-mono-code text-zinc-400">
              Configured via `VITE_WHATSAPP_ACCOUNT_SID` & `VITE_WHATSAPP_AUTH_TOKEN`.
            </p>

            <button
              type="button"
              onClick={() => handleSendTestNotification('WHATSAPP')}
              className="px-3.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[11px] font-mono-code text-zinc-300 hover:text-white flex items-center space-x-1.5"
            >
              <Send className="w-3 h-3" />
              <span>Test WhatsApp Dispatch</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4: AUDIT LOGS REPOSITORY */}
      <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-6 sm:p-8 space-y-4">
        <h3 className="font-cinzel text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-3 border-b border-white/10">
          <History className="w-4 h-4 text-red-500" />
          <span>HIGH COMMAND AUDIT HISTORY ({auditLogs.length})</span>
        </h3>

        <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.06] text-xs font-mono-code">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-red-400">{log.action}</span>
                <span className="text-zinc-500 mx-2">•</span>
                <span className="text-zinc-300">{log.entity_type}</span>
              </div>
              <span className="text-zinc-500">
                {new Date(log.created_at).toLocaleTimeString()} • {new Date(log.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
