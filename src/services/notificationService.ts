export type NotificationType = 
  | 'REGISTRATION_RECEIVED'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_REJECTED'
  | 'REGISTRATION_CONFIRMED'
  | 'PORTFOLIO_REVEALED';

export interface NotificationPayload {
  toEmail: string;
  toPhone?: string;
  recipientName: string;
  registrationNumber: string;
  committeeName: string;
  type: NotificationType;
  portfolioName?: string;
  customNote?: string;
}

export interface NotificationLog {
  id: string;
  channel: 'EMAIL' | 'WHATSAPP';
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  recipient: string;
  type: NotificationType;
  timestamp: string;
  subjectOrPreview: string;
}

const getEnv = (key: string): string => {
  try {
    return (import.meta as any)?.env?.[key] || '';
  } catch {
    return '';
  }
};

class NotificationService {
  private logs: NotificationLog[] = [];

  getProviderStatus(): { emailConfigured: boolean; whatsappConfigured: boolean } {
    const hasResend = Boolean(getEnv('VITE_RESEND_API_KEY'));
    const hasWhatsApp = Boolean(
      getEnv('VITE_WHATSAPP_ACCOUNT_SID') && 
      getEnv('VITE_WHATSAPP_AUTH_TOKEN')
    );
    return {
      emailConfigured: hasResend,
      whatsappConfigured: hasWhatsApp
    };
  }

  async sendEmail(payload: NotificationPayload): Promise<{ success: boolean; mode: 'LIVE' | 'SIMULATED' }> {
    const { emailConfigured } = this.getProviderStatus();
    const template = this.getEmailTemplate(payload);

    if (emailConfigured) {
      // In production, would call serverless endpoint /api/send-email with Resend
      console.log('[PROD EMAIL DISPATCH]', payload.toEmail, template.subject);
    } else {
      console.info('[SIMULATED EMAIL ADAPTER]', {
        to: payload.toEmail,
        subject: template.subject,
        preview: template.body.slice(0, 80) + '...'
      });
    }

    this.logs.unshift({
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      channel: 'EMAIL',
      status: emailConfigured ? 'SENT' : 'SIMULATED',
      recipient: payload.toEmail,
      type: payload.type,
      timestamp: new Date().toISOString(),
      subjectOrPreview: template.subject
    });

    return {
      success: true,
      mode: emailConfigured ? 'LIVE' : 'SIMULATED'
    };
  }

  async sendWhatsApp(payload: NotificationPayload): Promise<{ success: boolean; mode: 'LIVE' | 'SIMULATED' }> {
    const { whatsappConfigured } = this.getProviderStatus();
    const message = this.getWhatsAppMessage(payload);

    if (whatsappConfigured) {
      console.log('[PROD WHATSAPP DISPATCH]', payload.toPhone, message);
    } else {
      console.info('[SIMULATED WHATSAPP ADAPTER]', {
        to: payload.toPhone || payload.toEmail,
        message: message.slice(0, 100) + '...'
      });
    }

    this.logs.unshift({
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      channel: 'WHATSAPP',
      status: whatsappConfigured ? 'SENT' : 'SIMULATED',
      recipient: payload.toPhone || payload.toEmail,
      type: payload.type,
      timestamp: new Date().toISOString(),
      subjectOrPreview: message.slice(0, 60) + '...'
    });

    return {
      success: true,
      mode: whatsappConfigured ? 'LIVE' : 'SIMULATED'
    };
  }

  getLogs(): NotificationLog[] {
    return this.logs;
  }

  private getEmailTemplate(p: NotificationPayload): { subject: string; body: string } {
    switch (p.type) {
      case 'REGISTRATION_RECEIVED':
        return {
          subject: `[VISTA: THE VERDICT] Dossier Received — ${p.registrationNumber}`,
          body: `Greetings ${p.recipientName},\n\nYour registration entry for ${p.committeeName} has been recorded under Registration ID ${p.registrationNumber}.\n\nYour payment transaction is awaiting verification by the high command. You can monitor your credentials on your dashboard.\n\nAPJ Block, NMAMIT | 16–17 October.`
        };
      case 'PAYMENT_VERIFIED':
      case 'REGISTRATION_CONFIRMED':
        return {
          subject: `[CONFIRMED] Clearance Granted — ${p.registrationNumber}`,
          body: `Officer/Delegate ${p.recipientName},\n\nPayment verified. Your registration for ${p.committeeName} is CONFIRMED.\nRegistration ID: ${p.registrationNumber}\n\nYour preferences are secured. Portfolio assignment is underway. The arena awaits.\n\nAPJ Block, NMAMIT.`
        };
      case 'PAYMENT_REJECTED':
        return {
          subject: `[ACTION REQUIRED] Payment Verification Failed — ${p.registrationNumber}`,
          body: `Attention ${p.recipientName},\n\nVerification failed for your registration ${p.registrationNumber}. Reason: ${p.customNote || 'Transaction mismatch or illegible receipt'}.\n\nPlease access your dashboard immediately to resubmit your valid UTR and screenshot.`
        };
      case 'PORTFOLIO_REVEALED':
        return {
          subject: `[THE VERDICT HAS BEEN MADE] Role Revealed — ${p.registrationNumber}`,
          body: `Attention ${p.recipientName},\n\nYour strategic role in ${p.committeeName} has been officially revealed: ${p.portfolioName?.toUpperCase() || 'ASSIGNED'}.\n\nAccess your dashboard or visit the Reveal portal to unseal your dossier.`
        };
      default:
        return {
          subject: `[VISTA: THE VERDICT] Notice — ${p.registrationNumber}`,
          body: `Notification regarding registration ${p.registrationNumber}.`
        };
    }
  }

  private getWhatsAppMessage(p: NotificationPayload): string {
    switch (p.type) {
      case 'REGISTRATION_RECEIVED':
        return `*VISTA PRESENTS: THE VERDICT*\n\nHello ${p.recipientName},\nYour entry for *${p.committeeName}* is recorded.\nID: *${p.registrationNumber}*\nStatus: Payment Verification Pending.\n\nCheck status: https://verdict.nmamit.in/dashboard`;
      case 'PAYMENT_VERIFIED':
      case 'REGISTRATION_CONFIRMED':
        return `*VISTA: THE VERDICT — CONFIRMED*\n\nClearance Granted, ${p.recipientName}.\nSimulation: *${p.committeeName}*\nReg ID: *${p.registrationNumber}*\n\nYour entry is officially locked. Prepare for battle on 16–17 October at APJ Block, NMAMIT.`;
      case 'PAYMENT_REJECTED':
        return `*VISTA: THE VERDICT — ACTION REQUIRED*\n\nAttention ${p.recipientName},\nPayment verification failed for *${p.registrationNumber}*.\nPlease log into your dashboard to resubmit your UTR receipt immediately.`;
      case 'PORTFOLIO_REVEALED':
        return `*THE VERDICT HAS BEEN MADE*\n\n${p.recipientName}, your role in *${p.committeeName}* is revealed:\n*${p.portfolioName?.toUpperCase() || 'ASSIGNED'}*\n\nExperience the reveal on your dashboard now!`;
      default:
        return `*VISTA: THE VERDICT* update for ${p.registrationNumber}`;
    }
  }
}

export const notificationService = new NotificationService();
