import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BatchDispatchPlanner from '../../components/BatchDispatchPlanner.jsx';
import WorkforceSkillsPlanner from '../../components/WorkforceSkillsPlanner.jsx';
import AdminAnomalyDrawer from '../../components/AdminAnomalyDrawer.jsx';

describe('Advanced Dashboard Planners & Governance (D6, D10, D11)', () => {
  const sampleOrders = [
    { id: 'ORD-1', customer: 'User 1', appliance: 'Air Conditioner', location: 'Klang Valley', status: 'PENDING' },
    { id: 'ORD-2', customer: 'User 2', appliance: 'Refrigerator', location: 'Klang Valley', status: 'PENDING' },
  ];
  const sampleTechs = [
    { code: 'T-001', name: 'Satou Kenji', skills: ['Air Conditioner'], status: 'ONLINE', zone: 'Klang Valley' },
    { code: 'T-002', name: 'Ahmad Razif', skills: ['Refrigerator'], status: 'ONLINE', zone: 'Klang Valley' },
  ];

  it('BatchDispatchPlanner (D6) renders timeline, KPIs, and handles apply/undo with zero emojis', () => {
    const handleApply = vi.fn();
    render(
      <BatchDispatchPlanner
        orders={sampleOrders}
        technicians={sampleTechs}
        onApplyPlan={handleApply}
      />
    );

    expect(screen.getByText(/Daily Fleet Dispatch Planner/i)).toBeInTheDocument();
    expect(screen.getByText(/Assigned Ratio/i)).toBeInTheDocument();
    expect(screen.getByText(/Specialist Timeline Schedule/i)).toBeInTheDocument();

    const applyBtn = screen.getByText(/Approve & Apply Plan/i);
    fireEvent.click(applyBtn);

    expect(handleApply).toHaveBeenCalled();
    expect(screen.getByText(/Plan Active/i)).toBeInTheDocument();
    expect(screen.getByText(/Undo Plan/i)).toBeInTheDocument();

    // Verify zero emojis
    const textContent = document.body.textContent || '';
    expect(textContent).not.toMatch(/[\uD83C-\uDBFF\uDC00-\uDFFF]/);
  });

  it('WorkforceSkillsPlanner (D11) renders 4-week coverage heat map and expiring certifications with zero emojis', () => {
    render(<WorkforceSkillsPlanner technicians={sampleTechs} />);

    expect(screen.getByText(/Workforce & Skills-Gap Planner/i)).toBeInTheDocument();
    expect(screen.getByText(/Category Coverage Ratio Matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/Expiring Certifications/i)).toBeInTheDocument();
    expect(screen.getByText(/Export CSV/i)).toBeInTheDocument();

    // Verify zero emojis
    const textContent = document.body.textContent || '';
    expect(textContent).not.toMatch(/[\uD83C-\uDBFF\uDC00-\uDFFF]/);
  });

  it('AdminAnomalyDrawer (D10) displays security alerts and allows review actions with zero emojis', () => {
    const handleReview = vi.fn();
    render(
      <AdminAnomalyDrawer
        isOpen={true}
        onClose={vi.fn()}
        onReviewAlert={handleReview}
      />
    );

    expect(screen.getByText(/Admin Activity Anomaly Detection/i)).toBeInTheDocument();
    expect(screen.getByText(/Off-Hours Pricing Modification/i)).toBeInTheDocument();
    expect(screen.getByText(/Mass Data Modification Burst/i)).toBeInTheDocument();

    const dismissBtns = screen.getAllByText(/Dismiss \(False Positive\)/i);
    fireEvent.click(dismissBtns[0]);
    expect(handleReview).toHaveBeenCalled();

    // Verify zero emojis
    const textContent = document.body.textContent || '';
    expect(textContent).not.toMatch(/[\uD83C-\uDBFF\uDC00-\uDFFF]/);
  });
});
