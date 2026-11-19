import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TechnicianAppraisalModal from '../../components/TechnicianAppraisalModal.jsx';
import FinancialReportModal from '../../components/FinancialReportModal.jsx';

const MOCK_FLEET = [
  {
    id: 1,
    code: 'T-001',
    name: 'Sarah Izzah',
    specialty: 'Heating and Cooling (HVAC)',
    zone: 'Kuala Lumpur (Cheras / Ampang / Bukit Bintang)',
    rating: 4.9,
    completedJobs: 42,
    firstFixRate: '92%',
    avatar: '/logo1.png',
  },
  {
    id: 2,
    code: 'T-002',
    name: 'Jason Rahman',
    specialty: 'Laundry & Fabric Care',
    zone: 'Selangor (Petaling Jaya / Subang Jaya / Sunway)',
    rating: 4.4,
    completedJobs: 26,
    firstFixRate: '84%',
    avatar: '/logo1.png',
  },
];

describe('Technician Appraisal & Combined Financial Report Suite', () => {
  it('renders TechnicianAppraisalModal with KPIs, AI work ethics, achievements, mistakes, and promotion recommendation', () => {
    const onClose = vi.fn();
    render(
      <TechnicianAppraisalModal
        isOpen={true}
        onClose={onClose}
        technician={MOCK_FLEET[0]}
        fleet={MOCK_FLEET}
      />
    );

    // Header & Tech Bio
    expect(screen.getByText(/Technician AI Performance Appraisal & Work Ethics Report/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sarah Izzah/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/T-001/i).length).toBeGreaterThanOrEqual(1);

    // KPI Scorecard checks
    expect(screen.getByText(/Fleet Performance KPI Scorecard/i)).toBeInTheDocument();
    expect(screen.getAllByText(/First-Time Fix/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/92%/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Completed Jobs/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/42/i).length).toBeGreaterThanOrEqual(1);

    // AI Work Ethics & Conduct Profile
    expect(screen.getByText(/AI Work Ethics & Professional Conduct Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Exhibits exemplary professional discipline/i)).toBeInTheDocument();
    expect(screen.getByText(/CIDB electrical safety standards/i)).toBeInTheDocument();

    // Achievements & Mistakes
    expect(screen.getByText(/Key Achievements & Milestones/i)).toBeInTheDocument();
    expect(screen.getByText(/Bangsar Commercial Inverter Recovery/i)).toBeInTheDocument();
    expect(screen.getByText(/Logged Incidents & Mistakes/i)).toBeInTheDocument();
    expect(screen.getByText(/Late Status Update on Guardhouse Delay/i)).toBeInTheDocument();

    // AI Career Progression & Promotion Decision
    expect(screen.getAllByText(/Eligible for Promotion/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Targeted Training & Upskilling Syllabus/i)).toBeInTheDocument();
    expect(screen.getByText(/Fleet Squad Leadership & Mentorship Coaching/i)).toBeInTheDocument();

    // Switch to another tab (e.g. AI Work Ethics)
    const ethicsTab = screen.getByText('AI Work Ethics');
    fireEvent.click(ethicsTab);
    expect(screen.getByText(/Punctuality & Schedule Discipline/i)).toBeInTheDocument();

    // Zero Emojis check
    const textContent = document.body.textContent || '';
    expect(textContent).not.toMatch(/[\uD83C-\uDBFF\uDC00-\uDFFF]/);
  });

  it('renders FinancialReportModal in Combined Full Report mode for PDF print', () => {
    const onClose = vi.fn();
    render(<FinancialReportModal isOpen={true} onClose={onClose} />);

    // Switch to Combined Report tab
    const combinedTab = screen.getByText(/Combined Full Report \(PDF Print\)/i);
    fireEvent.click(combinedTab);

    // Verify Master Corporate Header & Registration
    expect(screen.getAllByText(/CyberHub Technologies Sdn\. Bhd\./i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/SSM Registration: 202401018923/i)).toBeInTheDocument();

    // Verify all 4 statements and sign-off section are present in combined document
    expect(screen.getByText(/Section I: Statement of Financial Position/i)).toBeInTheDocument();
    expect(screen.getByText(/STATEMENT OF FINANCIAL POSITION \(BALANCE SHEET\)/i)).toBeInTheDocument();
    expect(screen.getByText(/TOTAL ASSETS/i)).toBeInTheDocument();
    expect(screen.getByText(/TOTAL LIABILITIES & EQUITY/i)).toBeInTheDocument();

    expect(screen.getByText(/Section II: Statement of Profit or Loss/i)).toBeInTheDocument();
    expect(screen.getByText(/GROSS SERVICE REVENUE/i)).toBeInTheDocument();
    expect(screen.getByText(/NET PROFIT AFTER TAX/i)).toBeInTheDocument();

    expect(screen.getByText(/Section III: Statement of Cash Flows/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Net Cash Generated from Operating Activities/i)).toBeInTheDocument();

    expect(screen.getByText(/Section IV: Financial Solvency & Liquidity Ratios/i)).toBeInTheDocument();
    expect(screen.getByText(/Current Ratio/i)).toBeInTheDocument();

    expect(screen.getByText(/Section V: Statutory Declaration & Audit Sign-Off/i)).toBeInTheDocument();
    expect(screen.getByText(/Managing Director & Chief Executive/i)).toBeInTheDocument();
    expect(screen.getByText(/Chartered Accountant & Financial Controller/i)).toBeInTheDocument();

    // Verify Print Combined PDF trigger button exists
    expect(screen.getByText(/Print Combined PDF/i)).toBeInTheDocument();

    // Zero Emojis check
    const textContent = document.body.textContent || '';
    expect(textContent).not.toMatch(/[\uD83C-\uDBFF\uDC00-\uDFFF]/);
  });
});
