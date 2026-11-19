import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import KpiExplainerDrawer from '../../components/KpiExplainerDrawer.jsx';
import ExecutiveReportModal from '../../components/ExecutiveReportModal.jsx';
import * as api from '../../lib/api.js';

describe('D4: KPI Explainer & D5: Monthly Executive Report', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders KPI Explainer Drawer with waterfall drivers and next steps', async () => {
    vi.spyOn(api, 'explainKpiMetric').mockResolvedValue({
      metric: 'Total Revenue',
      period_a: 'Last Month',
      period_b: 'Current Month',
      total_delta: 7050.0,
      total_delta_pct: 18.4,
      unit: 'RM',
      summary: 'Revenue increased by RM 7,050.00 driven by HVAC repairs.',
      drivers: [
        { id: 'd1', label: 'Inverter HVAC in Mont Kiara', contribution: 3850.0, percentage: 54.6, evidence_ids: ['e1'], significant: true },
      ],
      caveats: ['Includes 3 public holidays.'],
      next_steps: [{ label: 'Review HVAC Orders', link: '/smart-orders' }],
      is_statistically_significant: true,
    });

    render(
      <BrowserRouter>
        <KpiExplainerDrawer metric="Total Revenue" isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Why Did This Change?')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText(/Revenue increased by RM 7,050.00/)).toBeInTheDocument();
      expect(screen.getByText(/Inverter HVAC in Mont Kiara/)).toBeInTheDocument();
      expect(screen.getByText('Review HVAC Orders')).toBeInTheDocument();
    });

    // Thumbs up feedback
    const thumbsUp = screen.getByText('Yes');
    fireEvent.click(thumbsUp);
  });

  it('renders Executive Report Modal with DRAFT watermark and approves it', async () => {
    vi.spyOn(api, 'fetchMonthlyExecutiveReport').mockResolvedValue({
      id: 'rep_202611_test',
      month: '2026-11',
      status: 'DRAFT',
      sha256: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      generated_at: '2026-11-14 08:00:00 UTC',
      title: 'CyberHub Operations Executive Report — 2026-11',
      sections: [
        {
          id: 's1',
          title: 'Executive Summary',
          narrative: 'Record revenue of RM 45,210.00 achieved.',
          metrics: [{ id: 'm1', label: 'Total Revenue', value: 45210.0, unit: 'RM' }],
          recommendations: ['Maintain inventory levels.'],
        },
      ],
    });

    vi.spyOn(api, 'approveExecutiveReport').mockResolvedValue({
      report_id: 'rep_202611_test',
      status: 'APPROVED',
      approved_by: 'Super Admin',
      approved_at: '2026-11-14T08:00:00Z',
    });

    render(
      <ExecutiveReportModal isOpen={true} onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Monthly Operations Executive Report')).toBeInTheDocument();
      expect(screen.getByText('Status: DRAFT')).toBeInTheDocument();
      expect(screen.getByText('DRAFT')).toBeInTheDocument(); // Watermark
      expect(screen.getByText('Approve Report')).toBeInTheDocument();
    });

    // Approve report
    const approveBtn = screen.getByText('Approve Report');
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(api.approveExecutiveReport).toHaveBeenCalled();
      expect(screen.getByText(/Status: APPROVED/)).toBeInTheDocument();
    });
  });
});
