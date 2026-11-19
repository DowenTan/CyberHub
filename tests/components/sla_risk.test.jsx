import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SmartOrders from '../../pages/SmartOrders.jsx';
import { calculateOrderSlaRisk } from '../../lib/slaRisk.js';

describe('D2: SLA Risk Prediction and Queue Prioritisation', () => {
  it('calculateOrderSlaRisk computes risk scores and bands deterministically', () => {
    // 1. Critical order with elapsed time exceeding SLA
    const breachedOrder = {
      id: 'ORD-TEST-1',
      urgency: 'CRITICAL',
      status: 'PENDING',
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45m ago (target 15m)
    };
    const breachedResult = calculateOrderSlaRisk(breachedOrder);
    expect(breachedResult.band).toBe('breached');
    expect(breachedResult.suggestedAction).toBe('escalate');
    expect(breachedResult.reasons[0]).toContain('SLA Breached');

    // 2. Completed order has low/zero risk
    const completedOrder = {
      id: 'ORD-TEST-2',
      urgency: 'NORMAL',
      status: 'COMPLETED',
    };
    const completedResult = calculateOrderSlaRisk(completedOrder);
    expect(completedResult.band).toBe('low');
    expect(completedResult.risk).toBe(0.0);
  });

  it('renders SLA Risk column and At Risk filter in Smart Orders', async () => {
    render(
      <BrowserRouter>
        <SmartOrders />
      </BrowserRouter>
    );

    // Filter tab "At Risk" exists
    const atRiskTab = screen.getByText(/At Risk/i);
    expect(atRiskTab).toBeInTheDocument();

    // SLA Risk column exists in table header and sort selector
    const slaRiskElements = screen.getAllByText('SLA Risk');
    expect(slaRiskElements.length).toBeGreaterThanOrEqual(1);

    // Clicking "At Risk" filter filters orders
    fireEvent.click(atRiskTab);
    expect(atRiskTab.closest('button')).toHaveClass('active');
  }, 15000);
});
