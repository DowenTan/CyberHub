import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import KeyboardShortcutsModal from '../../components/diagnostics/KeyboardShortcutsModal.jsx';
import {
  QueueResponseSchema,
  AssessmentDetailSchema,
  RepriceResponseSchema,
} from '../../lib/diagnosticsSchemas.js';

describe('Keyboard Shortcuts Modal', () => {
  it('renders list of keyboard shortcuts when open', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Navigate to next assessment in queue')).toBeInTheDocument();
    expect(screen.getByText('Approve selected assessment')).toBeInTheDocument();
    expect(screen.getByText('Toggle inline edit mode')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <KeyboardShortcutsModal isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('Zod Schema Validation', () => {
  it('validates a conformant Queue response successfully', () => {
    const validPayload = {
      items: [
        {
          id: 'DIAG-123',
          repair_request_id: 'REQ-456',
          booking_number: 'BK-789',
          brand: 'Samsung',
          model: 'WW90',
          appliance_category: 'laundry',
          status: 'completed',
          confidence: 0.95,
          top_cause: 'Motor Drive Failure',
          has_safety_flags: false,
          estimated_total_min: 220,
          estimated_total_max: 300,
          needs_human_review: false,
          review_status: 'approved',
        },
      ],
      next_cursor: null,
    };

    const parsed = QueueResponseSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
    expect(parsed.data.items[0].brand).toBe('Samsung');
  });

  it('rejects a malformed Queue response missing required fields', () => {
    const malformedPayload = {
      items: [
        {
          // missing 'id' and 'status'
          brand: 'Samsung',
        },
      ],
    };

    const parsed = QueueResponseSchema.safeParse(malformedPayload);
    expect(parsed.success).toBe(false);
  });

  it('validates AssessmentDetail schema with causes and estimate', () => {
    const validDetail = {
      id: 'DIAG-999',
      status: 'completed',
      probable_causes: [
        {
          rank: 1,
          name: 'Thermal Fuse Blown',
          likelihood: 0.85,
        },
      ],
      estimate: {
        diagnostic_fee: 50,
        total_max: 180,
      },
    };

    const parsed = AssessmentDetailSchema.safeParse(validDetail);
    expect(parsed.success).toBe(true);
    expect(parsed.data.probable_causes[0].likelihood).toBe(0.85);
  });

  it('rejects Reprice response with invalid estimate', () => {
    const invalidReprice = {
      status: 'ok',
      estimate: 'not-an-estimate-object', // must be an object
    };

    const parsed = RepriceResponseSchema.safeParse(invalidReprice);
    expect(parsed.success).toBe(false);
  });
});
