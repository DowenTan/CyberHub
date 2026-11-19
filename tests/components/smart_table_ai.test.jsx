import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SmartTable from '../../components/SmartTable.jsx';
import { buildTableCatalogue, parseTableQueryFallback } from '../../lib/tableCatalogue.js';
import * as api from '../../lib/api.js';

describe('D3: SmartTable Natural Language Query & Filter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  const sampleColumns = [
    { key: 'id', label: 'Order ID', type: 'text' },
    { key: 'customer', label: 'Customer Name', type: 'text' },
    { key: 'appliance', label: 'Appliance', type: 'text' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'urgency', label: 'Urgency', type: 'enum', enumValues: ['NORMAL', 'URGENT', 'CRITICAL', 'LOW'] },
    { key: 'status', label: 'Status', type: 'enum', enumValues: ['PENDING', 'DISPATCHED', 'COMPLETED'] },
  ];

  const sampleData = [
    { id: 'ORD-101', customer: 'Ahmad Latif', appliance: 'Washing Machine', location: 'Cheras, KL', urgency: 'URGENT', status: 'PENDING' },
    { id: 'ORD-102', customer: 'Tan Ah Kow', appliance: 'Refrigerator', location: 'Bangsar, KL', urgency: 'NORMAL', status: 'COMPLETED' },
    { id: 'ORD-103', customer: 'Muthu Kumar', appliance: 'Air Conditioner', location: 'Cheras, KL', urgency: 'CRITICAL', status: 'PENDING' },
    { id: 'ORD-104', customer: 'Sarah Lee', appliance: 'Microwave', location: 'Petaling Jaya', urgency: 'LOW', status: 'DISPATCHED' },
  ];

  it('buildTableCatalogue extracts metadata only, without row data or PII', () => {
    const catalogue = buildTableCatalogue(sampleColumns, 'test_orders');
    expect(catalogue).toHaveLength(6);
    expect(catalogue[0]).toEqual({
      key: 'id',
      label: 'Order ID',
      type: 'text',
      enumValues: undefined,
      synonyms: [],
      filterable: true,
    });
    expect(catalogue.find((c) => c.key === 'urgency')?.enumValues).toContain('URGENT');
    // Ensure no row data was leaked
    expect(JSON.stringify(catalogue)).not.toContain('Ahmad Latif');
    expect(JSON.stringify(catalogue)).not.toContain('Tan Ah Kow');
  });

  it('parseTableQueryFallback resolves multilingual queries deterministically', () => {
    const catalogue = buildTableCatalogue(sampleColumns, 'test_orders');

    // English
    const resEn = parseTableQueryFallback('test_orders', 'urgent jobs in cheras', catalogue);
    expect(resEn.filters.some((f) => f.column === 'urgency' && f.value === 'URGENT')).toBe(true);
    expect(resEn.filters.some((f) => f.column === 'location' && f.value === 'Cheras')).toBe(true);

    // Bahasa Melayu
    const resBm = parseTableQueryFallback('test_orders', 'kritikal kat cheras', catalogue);
    expect(resBm.filters.some((f) => f.column === 'urgency' && f.value === 'CRITICAL')).toBe(true);
    expect(resBm.filters.some((f) => f.column === 'location' && f.value === 'Cheras')).toBe(true);

    // Chinese
    const resCn = parseTableQueryFallback('test_orders', '加急 洗衣机', catalogue);
    expect(resCn.filters.some((f) => f.column === 'urgency' && f.value === 'URGENT')).toBe(true);
    expect(resCn.filters.some((f) => f.column === 'appliance' && f.value === 'Washing Machine')).toBe(true);
  });

  it('renders AI query input and applies filters as removable chips', async () => {
    vi.spyOn(api, 'queryTableNaturalLanguage').mockImplementation(async (tableId, text, catalogue) => {
      return parseTableQueryFallback(tableId, text, catalogue);
    });

    render(
      <SmartTable
        columns={sampleColumns}
        data={sampleData}
        tableId="orders_table"
        enableAiFilter={true}
      />
    );

    // AI input should be present
    const aiInput = screen.getByPlaceholderText(/Ask table/i);
    expect(aiInput).toBeInTheDocument();

    // All 4 rows rendered initially
    expect(screen.getByText('ORD-101')).toBeInTheDocument();
    expect(screen.getByText('ORD-102')).toBeInTheDocument();
    expect(screen.getByText('ORD-103')).toBeInTheDocument();
    expect(screen.getByText('ORD-104')).toBeInTheDocument();

    // Query for "urgent"
    fireEvent.change(aiInput, { target: { value: 'urgent' } });
    fireEvent.keyDown(aiInput, { key: 'Enter', code: 'Enter' });

    // Wait for filtered chips and filtered rows
    await waitFor(() => {
      expect(screen.getByText('Active Filters:')).toBeInTheDocument();
    });

    // ORD-101 is URGENT, others are not
    expect(screen.getByText('ORD-101')).toBeInTheDocument();
    expect(screen.queryByText('ORD-102')).not.toBeInTheDocument();
    expect(screen.queryByText('ORD-104')).not.toBeInTheDocument();

    // Remove the filter chip
    const removeBtn = screen.getByTitle('Remove this filter');
    fireEvent.click(removeBtn);

    // Rows restored
    await waitFor(() => {
      expect(screen.getByText('ORD-102')).toBeInTheDocument();
    });
  });

  it('focuses AI input on pressing "/" key shortcut', () => {
    render(
      <SmartTable
        columns={sampleColumns}
        data={sampleData}
        tableId="orders_table"
        enableAiFilter={true}
      />
    );

    const aiInput = screen.getByPlaceholderText(/Ask table/i);
    expect(document.activeElement).not.toBe(aiInput);

    // Press '/' on window
    fireEvent.keyDown(window, { key: '/' });
    expect(document.activeElement).toBe(aiInput);
  });
});
