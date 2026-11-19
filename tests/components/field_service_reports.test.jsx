import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FieldServiceReportsModal from '../../components/FieldServiceReportsModal.jsx';

describe('FieldServiceReportsModal', () => {
  const sampleOrder = {
    id: 'ORD-501',
    customer: 'Tan Kia Yu',
    phone: '+6012-3456789',
    location: 'Petaling Jaya, Selangor',
    appliance: 'Samsung Inverter Refrigerator (520L)',
    modelNumber: 'RT53K6271BS/SL',
    serialNumber: 'SN-SAMS-98234-KL',
    techName: 'Satou Kenji',
    techCode: 'T-001',
    status: 'COMPLETED',
    date: '2026-11-14',
    completionTime: '14:30 MYT',
  };

  it('renders Field Service Report (FSR) by default without emojis', () => {
    render(
      <FieldServiceReportsModal
        isOpen={true}
        orderData={sampleOrder}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/CyberHub Official Field Service Reports/i)).toBeInTheDocument();
    expect(screen.getAllByText(/FIELD SERVICE REPORT \(FSR\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/FSR-ORD-501/i)).toBeInTheDocument();
    expect(screen.getByText(/Physical Inspection Findings & System Checks/i)).toBeInTheDocument();
    expect(screen.getByText(/Defrost Thermal Fuse Continuity/i)).toBeInTheDocument();

    // Verify zero emoji glyphs
    const textContent = document.body.textContent || '';
    expect(textContent).not.toMatch(/[\uD83C-\uDBFF\uDC00-\uDFFF]/);
  });

  it('switches between all 6 report types accurately', () => {
    render(
      <FieldServiceReportsModal
        isOpen={true}
        orderData={sampleOrder}
        onClose={vi.fn()}
      />
    );

    // 2. Inspection & Diagnostics
    fireEvent.click(screen.getByText(/Inspection & Diagnostics/i));
    expect(screen.getByText(/APPLIANCE INSPECTION & DIAGNOSTIC REPORT/i)).toBeInTheDocument();
    expect(screen.getByText(/Economic Viability Assessment \(50% Cost-Benefit Rule\)/i)).toBeInTheDocument();
    expect(screen.getByText(/RECOMMEND REPAIR/i)).toBeInTheDocument();

    // 3. Preventive Maintenance
    fireEvent.click(screen.getByText(/Preventive Maintenance/i));
    expect(screen.getByText(/PREVENTIVE MAINTENANCE & HEALTH CHECK REPORT/i)).toBeInTheDocument();
    expect(screen.getByText(/Condenser Coil Dust Cleansing & Airflow Clearance/i)).toBeInTheDocument();
    expect(screen.getByText(/NEXT PREVENTIVE SERVICE DUE/i)).toBeInTheDocument();

    // 4. Quotation & Cost Breakdown
    fireEvent.click(screen.getByText(/Quotation & Cost Breakdown/i));
    expect(screen.getByText(/QUOTATION & ITEMIZED COST BREAKDOWN/i)).toBeInTheDocument();
    expect(screen.getByText(/Certified OEM Defrost Thermal Fuse Assembly/i)).toBeInTheDocument();

    // 5. Invoice & Billing Receipt
    fireEvent.click(screen.getByText(/Invoice & Billing Receipt/i));
    expect(screen.getByText(/TAX INVOICE & OFFICIAL RECEIPT/i)).toBeInTheDocument();
    expect(screen.getByText(/PAID & SETTLED/i)).toBeInTheDocument();
    expect(screen.getByText(/Official 90-Day Service & Parts Warranty Certificate/i)).toBeInTheDocument();

    // 6. Customer CSAT & Feedback
    fireEvent.click(screen.getByText(/Customer CSAT & Feedback/i));
    expect(screen.getByText(/CUSTOMER SATISFACTION & FEEDBACK AUDIT/i)).toBeInTheDocument();
    expect(screen.getByText(/5\/5 EXCELLENT/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified Client Comment/i)).toBeInTheDocument();
  });

  it('triggers print window on button click', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(
      <FieldServiceReportsModal
        isOpen={true}
        orderData={sampleOrder}
        onClose={vi.fn()}
      />
    );

    const printBtn = screen.getByText(/Print \/ Save PDF/i);
    fireEvent.click(printBtn);
    expect(printSpy).toHaveBeenCalled();
  });
});
