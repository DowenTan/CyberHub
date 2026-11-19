import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CatalogueHealthAssistant from '../../components/CatalogueHealthAssistant.jsx';
import * as api from '../../lib/api.js';

describe('D9: Spare-parts Catalogue Assistant', () => {
  const sampleParts = [
    { sku: 'SP-101', name: 'Inverter Board', cost: 120, markup: 45, category: 'Cooling' },
    { sku: 'SP-102', name: 'Thermostat Sensor', cost: 50, markup: 8, category: 'Cooling' }, // Low margin
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders health audit with health score and detects low margin', async () => {
    vi.spyOn(api, 'auditPartsCatalogue').mockResolvedValue({
      health_score: 82,
      total_parts_analyzed: 2,
      findings: [
        {
          id: 'low_margin_SP-102',
          type: 'low_margin',
          severity: 'warning',
          title: 'Low Margin Floor: Thermostat Sensor',
          explanation: 'Markup is only 8%, below 15% floor.',
          affected_skus: ['SP-102'],
          proposed_diff: { sku: 'SP-102', field: 'markup', current_value: 8, proposed_value: 25 },
        },
      ],
      critical_count: 0,
      warning_count: 1,
      info_count: 0,
    });

    render(
      <CatalogueHealthAssistant parts={sampleParts} isOpen={true} onClose={vi.fn()} onApplyDiff={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Spare-Parts Catalogue Assistant')).toBeInTheDocument();
      expect(screen.getByText('82 / 100')).toBeInTheDocument();
      expect(screen.getByText(/Low Margin Floor: Thermostat Sensor/)).toBeInTheDocument();
      expect(screen.getByText('Apply Fix')).toBeInTheDocument();
    });
  });

  it('switches to Price Simulator tab and renders simulation result', async () => {
    vi.spyOn(api, 'simulatePartsPriceChange').mockResolvedValue({
      markup_delta_pct: 5.0,
      affected_parts_count: 2,
      projected_revenue_impact_monthly: 204.0,
      projected_margin_impact_monthly: 204.0,
      guardrail_exceeded: false,
    });

    render(
      <CatalogueHealthAssistant parts={sampleParts} isOpen={true} onClose={vi.fn()} onApplyDiff={vi.fn()} />
    );

    // Switch to Price Simulator
    const simTab = screen.getByText('Price Simulator');
    fireEvent.click(simTab);

    await waitFor(() => {
      expect(screen.getByText(/Simulated Markup Adjustment/)).toBeInTheDocument();
      expect(screen.getByText(/Monthly Revenue Impact/)).toBeInTheDocument();
      expect(screen.getAllByText('+RM 204.00').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('switches to CSV Importer tab and parses sample CSV', async () => {
    render(
      <CatalogueHealthAssistant parts={sampleParts} isOpen={true} onClose={vi.fn()} />
    );

    // Switch to CSV Importer
    const importTab = screen.getByText('CSV Importer');
    fireEvent.click(importTab);

    const textarea = screen.getByPlaceholderText(/SKU,Part Name,Supplier Cost/i);
    expect(textarea).toBeInTheDocument();

    const sampleCsv = `SKU,Part Name,Supplier Cost,Category\nSP-999,Fan Motor,85.00,Cooling`;
    fireEvent.change(textarea, { target: { value: sampleCsv } });

    const validateBtn = screen.getByText('Validate & Preview Diff');
    fireEvent.click(validateBtn);

    await waitFor(() => {
      expect(screen.getByText('SP-999')).toBeInTheDocument();
      expect(screen.getByText('Fan Motor')).toBeInTheDocument();
      expect(screen.getByText('RM 85.00')).toBeInTheDocument();
      expect(screen.getByText('NEW')).toBeInTheDocument();
    });
  });
});
