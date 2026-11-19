import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DuplicateReviewModal from '../../components/DuplicateReviewModal.jsx';
import { detectLocalDuplicates } from '../../lib/duplicateDetection.js';

describe('DuplicateReviewModal & Detection (D8)', () => {
  const sampleFinding = {
    id: 'dup_101_102',
    orderId: 'ORD-102',
    relatedOrderId: 'ORD-101',
    kind: 'duplicate',
    confidencePct: 94,
    signals: ['Same customer name booked twice', 'Identical appliance model & service zone'],
    orderA: {
      id: 'ORD-102',
      customer: 'Lee Wei Kang',
      appliance: 'Air Conditioner',
      location: 'Klang Valley',
      status: 'PENDING',
      issue: 'Blower water leakage',
    },
    orderB: {
      id: 'ORD-101',
      customer: 'Lee Wei Kang',
      appliance: 'Air Conditioner',
      location: 'Klang Valley',
      status: 'PENDING',
      issue: 'Water leaking from indoor unit',
    },
    explanation: 'Potential duplicate booking of ORD-101.',
  };

  it('renders side-by-side order comparison and matched signals without emojis', () => {
    render(
      <DuplicateReviewModal
        isOpen={true}
        finding={sampleFinding}
        onClose={vi.fn()}
        onResolve={vi.fn()}
      />
    );

    expect(screen.getByText(/Potential Duplicate Order/i)).toBeInTheDocument();
    expect(screen.getByText(/94% Match/i)).toBeInTheDocument();
    expect(screen.getByText(/#ORD-102 \(Flagged\)/i)).toBeInTheDocument();
    expect(screen.getByText(/#ORD-101 \(Existing Order\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Same customer name booked twice/i)).toBeInTheDocument();

    // Verify zero emoji characters
    const modalText = document.body.textContent || '';
    expect(modalText).not.toMatch(/[\uD83C-\uDBFF\uDC00-\uDFFF]/);
  });

  it('calls onResolve with link_and_cancel action when cancel button clicked', () => {
    const handleResolve = vi.fn();
    render(
      <DuplicateReviewModal
        isOpen={true}
        finding={sampleFinding}
        onClose={vi.fn()}
        onResolve={handleResolve}
      />
    );

    const cancelLinkBtn = screen.getByText(/Cancel #ORD-102 & Link to #ORD-101/i);
    fireEvent.click(cancelLinkBtn);
    expect(handleResolve).toHaveBeenCalledWith(sampleFinding, 'link_and_cancel');
  });

  it('detectLocalDuplicates accurately finds duplicate pairs', () => {
    const orders = [
      { id: 'O-1', customer: 'Alice Wong', appliance: 'Air Conditioner', location: 'Cheras', status: 'PENDING' },
      { id: 'O-2', customer: 'Alice Wong', appliance: 'Air Conditioner', location: 'Cheras', status: 'PENDING' },
    ];
    const dups = detectLocalDuplicates(orders);
    expect(dups.length).toBe(1);
    expect(dups[0].kind).toBe('duplicate');
    expect(dups[0].confidencePct).toBe(94);
  });
});
