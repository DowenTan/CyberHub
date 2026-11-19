import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DiagnosticsQueue from '../../components/diagnostics/DiagnosticsQueue.jsx';

const mockItems = [
  {
    id: 'DIAG-001',
    repair_request_id: 'REQ-001',
    booking_number: 'BK-1001',
    brand: 'Daikin',
    model: 'Inverter 1.5HP',
    appliance_category: 'cooling',
    status: 'completed',
    confidence: 0.92,
    suggested_urgency: 'high',
    top_cause: 'Compressor Inverter Board Malfunction',
    has_safety_flags: false,
    estimated_total_min: 180,
    estimated_total_max: 260,
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'DIAG-002',
    repair_request_id: 'REQ-002',
    booking_number: 'BK-1002',
    brand: 'Panasonic',
    model: 'Front Load Washer',
    appliance_category: 'laundry',
    status: 'pending',
    confidence: 0.48, // low confidence band (<0.55 red)
    suggested_urgency: 'emergency',
    top_cause: 'Drain Pump Jammed',
    has_safety_flags: true,
    estimated_total_min: 120,
    estimated_total_max: 160,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

describe('DiagnosticsQueue Component', () => {
  it('renders queue items with booking number, appliance, confidence, and age', () => {
    const onSelect = vi.fn();
    const onUpdateFilters = vi.fn();

    render(
      <DiagnosticsQueue
        items={mockItems}
        selectedId="DIAG-001"
        onSelect={onSelect}
        filters={{ status: 'all', category: 'all', minConfidence: 0 }}
        onUpdateFilters={onUpdateFilters}
        isLoading={false}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('BK-1001')).toBeInTheDocument();
    expect(screen.getByText('Daikin Inverter 1.5HP')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();

    expect(screen.getByText('BK-1002')).toBeInTheDocument();
    expect(screen.getByText('Panasonic Front Load Washer')).toBeInTheDocument();
    expect(screen.getByText('48%')).toBeInTheDocument();
    expect(screen.getByText('Safety')).toBeInTheDocument();
    expect(screen.getByTitle('Emergency priority')).toBeInTheDocument();
  });

  it('clicking a queue row triggers onSelect with the assessment id', () => {
    const onSelect = vi.fn();
    render(
      <DiagnosticsQueue
        items={mockItems}
        selectedId="DIAG-001"
        onSelect={onSelect}
        filters={{ status: 'all', category: 'all' }}
        onUpdateFilters={vi.fn()}
        isLoading={false}
        onRefresh={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('BK-1002'));
    expect(onSelect).toHaveBeenCalledWith('DIAG-002');
  });

  it('updates status filter when clicking a status chip', () => {
    const onUpdateFilters = vi.fn();
    render(
      <DiagnosticsQueue
        items={mockItems}
        selectedId="DIAG-001"
        onSelect={vi.fn()}
        filters={{ status: 'all', category: 'all' }}
        onUpdateFilters={onUpdateFilters}
        isLoading={false}
        onRefresh={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Needs Review' }));
    expect(onUpdateFilters).toHaveBeenCalledWith({ status: 'needs_review' });
  });

  it('updates category filter when selecting category', () => {
    const onUpdateFilters = vi.fn();
    render(
      <DiagnosticsQueue
        items={mockItems}
        selectedId="DIAG-001"
        onSelect={vi.fn()}
        filters={{ status: 'all', category: 'all' }}
        onUpdateFilters={onUpdateFilters}
        isLoading={false}
        onRefresh={vi.fn()}
      />
    );

    const select = screen.getByRole('combobox', { name: 'Category' });
    fireEvent.change(select, { target: { value: 'cooling' } });
    expect(onUpdateFilters).toHaveBeenCalledWith({ category: 'cooling' });
  });

  it('shows empty state when no items match filters', () => {
    render(
      <DiagnosticsQueue
        items={[]}
        selectedId={null}
        onSelect={vi.fn()}
        filters={{ status: 'all', category: 'all' }}
        onUpdateFilters={vi.fn()}
        isLoading={false}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('No diagnostics match current filters.')).toBeInTheDocument();
  });
});
