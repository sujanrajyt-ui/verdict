import * as XLSX from 'xlsx';
import { FullRegistrationDetail } from '../types';

export class ExportService {
  /**
   * Export All Registrations (Master Sheet)
   */
  exportAllRegistrations(data: FullRegistrationDetail[], format: 'xlsx' | 'csv' = 'xlsx'): void {
    const rows = data.map((d) => {
      const reg = d.registration;
      const ind = d.individual;
      const team = d.team;
      const pay = d.payment;
      const asg = d.assignment;

      return {
        'Registration ID': reg.registration_number,
        'Simulation / Battle': d.committee?.name || '',
        'Type': reg.registration_type,
        'Status': reg.status,
        'Lead / Participant Name': ind ? ind.full_name : (d.team_members?.[0]?.full_name || ''),
        'Team Name': team ? team.team_name : 'N/A',
        'Contact Email': reg.contact_email,
        'USN': ind ? ind.usn : (d.team_members?.[0]?.usn || ''),
        'Branch': ind ? ind.branch : (d.team_members?.[0]?.branch || ''),
        'Year': ind ? ind.year : (d.team_members?.[0]?.year || ''),
        'Pricing Category': pay?.pricing_category || 'N/A',
        'Fee Paid (INR)': pay?.amount || 0,
        'UTR / Ref': pay?.utr || 'N/A',
        'Payment Status': pay?.status || 'N/A',
        'Pref 1': d.preferences[0]?.portfolio?.name || 'N/A',
        'Pref 2': d.preferences[1]?.portfolio?.name || 'N/A',
        'Pref 3': d.preferences[2]?.portfolio?.name || 'N/A',
        'Assigned Portfolio': asg?.portfolio?.name || 'UNASSIGNED',
        'Preference Level Achieved': asg?.preference_rank ? `Rank ${asg.preference_rank}` : (asg ? 'Fallback' : 'N/A'),
        'Reveal Status': reg.reveal_status,
        'Created At': reg.created_at,
        'Confirmed At': reg.confirmed_at || 'Pending',
      };
    });

    this.download(rows, 'THE_VERDICT_Master_Registrations', format);
  }

  /**
   * Export Confirmed Participants Only
   */
  exportConfirmedParticipants(data: FullRegistrationDetail[], format: 'xlsx' | 'csv' = 'xlsx'): void {
    const confirmed = data.filter((d) => d.registration.status === 'CONFIRMED');
    this.exportAllRegistrations(confirmed, format);
  }

  /**
   * Export Filtered by Committee
   */
  exportByCommittee(data: FullRegistrationDetail[], committeeSlug: string, committeeName: string, format: 'xlsx' | 'csv' = 'xlsx'): void {
    const filtered = data.filter((d) => d.committee?.slug === committeeSlug);
    this.exportAllRegistrations(filtered, format);
  }

  /**
   * Export Payment Records
   */
  exportPayments(data: FullRegistrationDetail[], format: 'xlsx' | 'csv' = 'xlsx'): void {
    const rows = data.map((d) => {
      const p = d.payment;
      return {
        'Registration ID': d.registration.registration_number,
        'Participant / Team': d.individual?.full_name || d.team?.team_name || '',
        'Battle': d.committee?.name || '',
        'Amount': p?.amount || 0,
        'Currency': p?.currency || 'INR',
        'Pricing Category': p?.pricing_category || '',
        'UTR / Transaction ID': p?.utr || '',
        'Payment Status': p?.status || '',
        'Submitted At': p?.submitted_at || '',
        'Verified At': p?.verified_at || '',
        'Verified By': p?.verified_by || '',
        'Screenshot Path': p?.screenshot_path || '',
      };
    });

    this.download(rows, 'THE_VERDICT_Payment_Ledger', format);
  }

  /**
   * Export Portfolio Assignments
   */
  exportAssignments(data: FullRegistrationDetail[], format: 'xlsx' | 'csv' = 'xlsx'): void {
    const rows = data
      .filter((d) => d.assignment)
      .map((d) => ({
        'Registration ID': d.registration.registration_number,
        'Participant / Team': d.individual?.full_name || d.team?.team_name || '',
        'Committee': d.committee?.name || '',
        'Assigned Role / Portfolio': d.assignment?.portfolio?.name || '',
        'Allocation Rank': d.assignment?.preference_rank ? `Preference #${d.assignment.preference_rank}` : 'Admin / Fallback',
        'Assignment Type': d.assignment?.assignment_type || '',
        'Reveal Status': d.registration.reveal_status,
        'Assigned At': d.assignment?.assigned_at || '',
      }));

    this.download(rows, 'THE_VERDICT_Portfolio_Assignments', format);
  }

  /**
   * Export IPL Teams with All Members
   */
  exportIPLTeams(data: FullRegistrationDetail[], format: 'xlsx' | 'csv' = 'xlsx'): void {
    const rows: any[] = [];
    data
      .filter((d) => d.registration.registration_type === 'TEAM')
      .forEach((d) => {
        d.team_members?.forEach((m, idx) => {
          rows.push({
            'Registration ID': d.registration.registration_number,
            'Team Name': d.team?.team_name || '',
            'Member Role': m.is_leader ? 'LEAD REGISTRANT' : `MEMBER #${idx + 1}`,
            'Full Name': m.full_name,
            'USN': m.usn,
            'Email': m.email,
            'Branch': m.branch,
            'Year': m.year,
            'Payment Status': d.registration.status,
            'Assigned Franchise': d.assignment?.portfolio?.name || 'PENDING',
          });
        });
      });

    this.download(rows, 'THE_VERDICT_IPL_Franchise_Teams', format);
  }

  private download(rows: any[], filename: string, format: 'xlsx' | 'csv'): void {
    if (rows.length === 0) {
      alert('No records available to export.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    if (format === 'csv') {
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    }
  }
}

export const exportService = new ExportService();
