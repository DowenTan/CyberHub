import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DiagnosticsActions from '../../components/diagnostics/DiagnosticsActions.jsx';

const mockAssessmentWithSafety = {
  id: 'DIAG-201',
  review_status: 'pending',
  safety_flags: [
    {
      code: 'REFRIGERANT_PRESSURE',
      severity: 'critical',
      description: 'System over-pressurized hazard.',
    },
  ],
  recommended_parts: [{ sku: 'PRT-VALVE', name: 'Service Valve', unit_price: 45 }],
  estimate: {
    diagnostic_fee: 50,
    labor_hours_max: 1.5,
    labor_cost_max: 90,
    parts_cost_total: 45,
    transport_fee: 25,
    total_max: 226.8,
  },
};

const mockApprovedAssessment = {
  id: 'DIAG-202',
  review_status: 'approved',
  safety_flags: [],
  recommended_parts: [],
  estimate: {
    total_max: 180,
  },
};

describe('DiagnosticsActions Component', () => {
  it('disables "Generate Draft Quote" button when not approved', () => {
    render(
      <DiagnosticsActions
        assessment={mockAssessmentWithSafety}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onRerun={vi.fn()}
        onReprice={vi.fn()}
        onCreateQuote={vi.fn()}
        onFeedback={vi.fn()}
        isReviewLoading={false}
        isQuoteLoading={false}
      />
    );

    const quoteBtn = screen.getByRole('button', { name: /Generate Draft Quote/i });
    expect(quoteBtn).toBeDisabled();
  });

  it('blocks quote creation until critical safety flag is acknowledged', () => {
    const onCreateQuote = vi.fn();
    const approvedWithSafety = {
      ...mockAssessmentWithSafety,
      review_status: 'approved',
    };

    render(
      <DiagnosticsActions
        assessment={approvedWithSafety}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onRerun={vi.fn()}
        onReprice={vi.fn()}
        onCreateQuote={onCreateQuote}
        onFeedback={vi.fn()}
        isReviewLoading={false}
        isQuoteLoading={false}
      />
    );

    const quoteBtn = screen.getByRole('button', { name: /Generate Draft Quote/i });
    expect(quoteBtn).toBeDisabled();

    // Acknowledge safety checkbox
    const ackCheckbox = screen.getByRole('checkbox', {
      name: /I acknowledge critical safety flags before approving\/quoting/i,
    });
    fireEvent.click(ackCheckbox);

    // Now button is enabled
    expect(quoteBtn).not.toBeDisabled();
    fireEvent.click(quoteBtn);
    expect(onCreateQuote).toHaveBeenCalledWith('DIAG-201');
  });

  it('triggers onApprove when clicking Approve Diagnosis button', () => {
    const onApprove = vi.fn();
    render(
      <DiagnosticsActions
        assessment={mockAssessmentWithSafety}
        onApprove={onApprove}
        onReject={vi.fn()}
        onRerun={vi.fn()}
        onReprice={vi.fn()}
        onCreateQuote={vi.fn()}
        onFeedback={vi.fn()}
        isReviewLoading={false}
        isQuoteLoading={false}
      />
    );

    const approveBtn = screen.getByRole('button', { name: /Approve Diagnosis/i });
    fireEvent.click(approveBtn);

    expect(onApprove).toHaveBeenCalledWith({
      id: 'DIAG-201',
      review_status: 'approved',
      review_notes: 'Approved without edits',
    });
  });

  it('inline edit opens, changes labor hours, and calculates live price diff', async () => {
    const onReprice = vi.fn().mockResolvedValue({
      status: 'ok',
      estimate: {
        total_max: 286.8, // +60.00 diff
      },
    });

    render(
      <DiagnosticsActions
        assessment={mockAssessmentWithSafety}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onRerun={vi.fn()}
        onReprice={onReprice}
        onCreateQuote={vi.fn()}
        onFeedback={vi.fn()}
        isReviewLoading={false}
        isQuoteLoading={false}
      />
    );

    // Click edit
    fireEvent.click(screen.getByRole('button', { name: /Edit Diagnosis & Hours/i }));
    expect(screen.getByText('Inline Adjustment')).toBeInTheDocument();

    // Change hours input
    const hoursInput = screen.getByRole('spinbutton');
    fireEvent.change(hoursInput, { target: { value: '2.5' } });

    await waitFor(() => {
      expect(onReprice).toHaveBeenCalled();
    });

    // Verify diff displays
    await waitFor(() => {
      expect(screen.getByText('RM 286.80')).toBeInTheDocument();
      expect(screen.getByText('+RM 60.00')).toBeInTheDocument();
    });
  });

  it('reject button opens modal and requires a reason', () => {
    const onReject = vi.fn();
    render(
      <DiagnosticsActions
        assessment={mockAssessmentWithSafety}
        onApprove={vi.fn()}
        onReject={onReject}
        onRerun={vi.fn()}
        onReprice={vi.fn()}
        onCreateQuote={vi.fn()}
        onFeedback={vi.fn()}
        isReviewLoading={false}
        isQuoteLoading={false}
      />
    );

    // Click reject button
    fireEvent.click(screen.getByRole('button', { name: /Reject Diagnosis/i }));
    expect(screen.getByText('Reject AI Diagnosis')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirm Reject/i });
    expect(confirmBtn).toBeDisabled();

    // Fill reason
    const textarea = screen.getByPlaceholderText(/Model incorrect/i);
    fireEvent.change(textarea, { target: { value: 'Incompatible sensor detected' } });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);
    expect(onReject).toHaveBeenCalledWith({
      id: 'DIAG-201',
      review_status: 'rejected',
      review_notes: 'Incompatible sensor detected',
    });
  });

  it('submits ground truth feedback when clicking feedback verdict', () => {
    const onFeedback = vi.fn();
    render(
      <DiagnosticsActions
        assessment={mockApprovedAssessment}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onRerun={vi.fn()}
        onReprice={vi.fn()}
        onCreateQuote={vi.fn()}
        onFeedback={onFeedback}
        isReviewLoading={false}
        isQuoteLoading={false}
      />
    );

    const correctBtn = screen.getByRole('button', { name: /^Correct$/i });
    fireEvent.click(correctBtn);

    expect(onFeedback).toHaveBeenCalledWith({
      id: 'DIAG-202',
      feedback: {
        verdict: 'correct',
        actual_cause: undefined,
        comment: undefined,
      },
    });
  });
});
