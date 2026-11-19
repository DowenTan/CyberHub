import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DiagnosticsDetail from '../../components/diagnostics/DiagnosticsDetail.jsx';

const mockDetail = {
  id: 'DIAG-100',
  booking_number: 'BK-5521',
  customer_first_name: 'Ahmad',
  address_city: 'Petaling Jaya',
  brand: 'Mitsubishi',
  model: 'Heavy Duty 2.0HP',
  appliance_category: 'cooling',
  status: 'completed',
  suggested_urgency: 'high',
  reported_symptoms: 'Indoor unit blowing warm air, outdoor condenser not engaging',
  summary: 'Compressor starter capacitor degraded causing thermal overload cut-off.',
  confidence: 0.88,
  safety_flags: [
    {
      code: 'HIGH_VOLTAGE_CAPACITOR',
      severity: 'critical',
      description: 'Stored high voltage charge in capacitor. Discharge before service.',
      category: 'Electrical Safety',
      requires_acknowledgement: true,
    },
  ],
  probable_causes: [
    {
      rank: 1,
      name: 'Run Capacitor Deterioration',
      likelihood: 0.78,
      reasoning: 'Outdoor fan runs but compressor stalls and clicks off on overload.',
      evidence: ['Warm air symptom', 'Condenser fan spinning', 'Compressor silent'],
    },
    {
      rank: 2,
      name: 'Refrigerant Leakage',
      likelihood: 0.18,
      reasoning: 'Low pressure switch prevented compressor start.',
      evidence: ['No cooling output'],
    },
  ],
  diagnostic_steps: [
    'Isolate mains power switch and verify 0V with multimeter',
    'Discharge outdoor capacitor using 20k ohm resistor',
    'Measure capacitor capacitance with microfarad meter',
  ],
  recommended_parts: [
    {
      sku: 'PRT-CAP-45UF',
      name: '45uF 450VAC Dual Run Capacitor',
      quantity: 1,
      unit_price: 65.0,
      in_stock: true,
    },
  ],
  estimate: {
    diagnostic_fee: 50.0,
    labor_hours_min: 1.0,
    labor_hours_max: 1.5,
    labor_rate_hourly: 60.0,
    labor_cost_min: 60.0,
    labor_cost_max: 90.0,
    parts_cost_total: 65.0,
    transport_fee: 25.0,
    subtotal_min: 200.0,
    subtotal_max: 230.0,
    sst_amount_min: 8.8,
    sst_amount_max: 11.2,
    total_min: 208.8,
    total_max: 241.2,
    currency: 'MYR',
    disclaimer: 'Pure deterministic estimate based on official catalog prices and 8% SST.',
  },
  customer_questions: [
    'How long has the indoor unit been blowing warm air?',
    'Did you hear any clicking noise from the outdoor compressor unit?',
  ],
  provider: 'mock',
  model_name: 'qwen2.5:7b',
  prompt_version: 'v1',
  pipeline_version: 'v1',
  latency_ms: 420,
  input_tokens: 350,
  output_tokens: 180,
  attempt: 1,
  created_at: new Date().toISOString(),
};

describe('DiagnosticsDetail Component', () => {
  it('renders booking, customer, appliance, and reported symptoms', () => {
    render(
      <DiagnosticsDetail
        assessment={mockDetail}
        isLoading={false}
        error={null}
        onRerun={vi.fn()}
      />
    );

    expect(screen.getByText('BK-5521')).toBeInTheDocument();
    expect(screen.getByText('Mitsubishi Heavy Duty 2.0HP')).toBeInTheDocument();
    expect(screen.getByText('Ahmad')).toBeInTheDocument();
    expect(screen.getByText(/Indoor unit blowing warm air/i)).toBeInTheDocument();
  });

  it('displays critical safety alert banner when critical flag is present', () => {
    render(
      <DiagnosticsDetail
        assessment={mockDetail}
        isLoading={false}
        error={null}
        onRerun={vi.fn()}
      />
    );

    expect(screen.getByText('Critical Safety Hazard Detected')).toBeInTheDocument();
    expect(screen.getByText(/Stored high voltage charge in capacitor/i)).toBeInTheDocument();
    expect(screen.getByText('[HIGH_VOLTAGE_CAPACITOR]')).toBeInTheDocument();
  });

  it('renders probable causes with ranked likelihood percentage', () => {
    render(
      <DiagnosticsDetail
        assessment={mockDetail}
        isLoading={false}
        error={null}
        onRerun={vi.fn()}
      />
    );

    expect(screen.getByText('Run Capacitor Deterioration')).toBeInTheDocument();
    expect(screen.getByText('78% Likelihood')).toBeInTheDocument();
    expect(screen.getByText('Refrigerant Leakage')).toBeInTheDocument();
    expect(screen.getByText('18% Likelihood')).toBeInTheDocument();
  });

  it('renders technician checklist steps', () => {
    render(
      <DiagnosticsDetail
        assessment={mockDetail}
        isLoading={false}
        error={null}
        onRerun={vi.fn()}
      />
    );

    expect(screen.getByText(/Isolate mains power switch/i)).toBeInTheDocument();
    expect(screen.getByText(/Discharge outdoor capacitor/i)).toBeInTheDocument();
  });

  it('renders recommended parts table with catalog pricing', () => {
    render(
      <DiagnosticsDetail
        assessment={mockDetail}
        isLoading={false}
        error={null}
        onRerun={vi.fn()}
      />
    );

    expect(screen.getByText('PRT-CAP-45UF')).toBeInTheDocument();
    expect(screen.getByText('45uF 450VAC Dual Run Capacitor')).toBeInTheDocument();
    expect(screen.getAllByText('RM 65.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });

  it('renders deterministic pricing estimate with 8% SST and total range', () => {
    render(
      <DiagnosticsDetail
        assessment={mockDetail}
        isLoading={false}
        error={null}
        onRerun={vi.fn()}
      />
    );

    expect(screen.getByText('RM 208.80 - RM 241.20')).toBeInTheDocument();
    expect(screen.getByText(/Sales & Service Tax \(SST 8% on Service\)/i)).toBeInTheDocument();
  });
});
